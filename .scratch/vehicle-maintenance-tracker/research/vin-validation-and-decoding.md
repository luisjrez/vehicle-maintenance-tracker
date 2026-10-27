# VIN validation and decoding (US market)

Research for [04 — VIN validation and decoding policy](../issues/04-vin-validation-and-decoding-policy.md). Researched 2026-10-26. v1 targets US-market vehicles ([02](../issues/02-market-locale-currency-units.md)); data belongs to an anonymous Owner identified by `X-Device-Id` ([01](../issues/01-data-ownership-without-auth.md), [ADR-0001](../../../docs/adr/0001-device-identity-without-auth.md)).

Sources (primary):

- 49 CFR Part 565 (eCFR, current as of 2026-10-01) — §565.2 Application, §565.13 General requirements, §565.15 Content requirements, Subpart C (MY 1981–2009 VINs). Fetched via `https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-49.xml?part=565&section=…`.
- NHTSA vPIC API docs — <https://vpic.nhtsa.dot.gov/api/> and FAQ <https://vpic.nhtsa.dot.gov/api/Home/Index/FAQ>.
- Live calls to `https://vpic.nhtsa.dot.gov/api/vehicles/…` on 2026-10-26 (samples below).
- ISO 3779 (not read directly — paywalled): known from summaries that it defines the 17-character structure (WMI/VDS/VIS) but does **not** mandate a check digit; the position-9 check digit is a North American requirement. Irrelevant for v1 since only US-market vehicles are targeted.

---

## 1. VIN rules for US-market vehicles (49 CFR 565)

| Rule | Source | Notes |
|---|---|---|
| Exactly **17 characters** | §565.13(b), (h) | Every position must be filled. |
| Allowed characters: `ABCDEFGHJKLMNPRSTUVWXYZ0123456789` — i.e. **no `I`, `O`, `Q`** | §565.13(g) | Capital sans-serif on the vehicle (§565.13(i)). |
| **Check digit** in position 9 (`0–9` or `X`) is mandatory | §565.13(c), §565.15(c) | Algorithm below. Exception: vehicles imported under 49 CFR 591.5(f) by someone other than the manufacturer (gray-market / non-conforming imports) are exempt from §565.13(b),(c),(g),(h) and §565.15 (§565.2(a)(1)). |
| Position 10 = **model year code**; never `I O Q U Z 0` | §565.15(d)(1), Table VII; vPIC error 11 | 30-year cycle: `A`=1980/2010 … `Y`=2000/2030, `1`–`9`=2001–2009/2031–2039. |
| Cycle disambiguation via **position 7** | §565.15(b), note to Table VII | For passenger cars, MPVs and trucks ≤ 10,000 lb GVWR: position 7 **numeric → 1980–2009**, **alphabetic → 2010–2039**. Only mandatory for vehicles under Subpart B (built from 2008/2009, MY2010+, §565.2); older (Subpart C) VINs were not required to keep position 7 numeric, so it is a heuristic for pre-2010 VINs. Does not apply to motorcycles, trailers, heavy trucks, buses. |
| Positions 13–17 numeric (cars, MPVs, trucks ≤ 10,000 lb); 14–17 numeric for all other vehicles | §565.15(d) | Useful extra sanity check; vPIC flags violations with error 400. |
| Positions 1–3 = WMI; `9` in position 3 means a low-volume manufacturer (6-char identifier with positions 12–14) | §565.15(a) | |
| Structured 17-char VINs start with **MY1981** (Subpart C, Table XIII begins at 1980=`A`) | Subpart C | **Pre-1981 VINs are free-form** (any length, often 11–13 chars, no check digit, may contain I/O/Q). vPIC has **no data before 1980** (FAQ), and decodes MY1980–1994 at only ~60–65 % confidence vs ~99 % for MY1995+. |

### Check digit algorithm (§565.15(c))

Transliteration (Table III): `A1 B2 C3 D4 E5 F6 G7 H8 J1 K2 L3 M4 N5 P7 R9 S2 T3 U4 V5 W6 X7 Y8 Z9`; digits are their own value.
Weights by position (Table IV): `8 7 6 5 4 3 2 10 0 9 8 7 6 5 4 3 2` (position 9 weight 0).
Sum the products, take remainder mod 11; remainder 10 → `X`.

```ts
// Pseudocode for the shared package (e.g. packages/vin)
const ALLOWED = /^[A-HJ-NPR-Z0-9]{17}$/;              // no I, O, Q
const VALUE: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8, J:1,K:2,L:3,M:4,N:5, P:7, R:9,
  S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9, '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
};
const WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';    // 30 codes, index 0 = 1980 / 2010

function normalizeVin(input: string): string {
  // Remove all whitespace and dashes users paste, then uppercase.
  return input.replace(/[\s-]/g, '').toUpperCase();
}

function computeCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += VALUE[vin[i]] * WEIGHTS[i];
  const r = sum % 11;
  return r === 10 ? 'X' : String(r);
}

type VinValidation =
  | { ok: true; vin: string; modelYearCandidates: number[] }
  | { ok: false; reason: 'LENGTH' | 'INVALID_CHARACTERS' | 'INVALID_YEAR_CODE' | 'CHECK_DIGIT' };

function validateVin(raw: string): VinValidation {
  const vin = normalizeVin(raw);
  if (vin.length !== 17) return { ok: false, reason: 'LENGTH' };
  if (!ALLOWED.test(vin)) return { ok: false, reason: 'INVALID_CHARACTERS' };   // I/O/Q or symbols
  const yearIndex = YEAR_CODES.indexOf(vin[9]);
  if (yearIndex < 0) return { ok: false, reason: 'INVALID_YEAR_CODE' };       // U, Z, 0
  if (computeCheckDigit(vin) !== vin[8]) return { ok: false, reason: 'CHECK_DIGIT' };
  // Year is a hint only; vPIC (or the user) is the authority.
  const older = 1980 + yearIndex, newer = 2010 + yearIndex;
  const candidates = /[A-Z]/.test(vin[6]) ? [newer] : [older, newer].filter(y => y <= currentYear + 1);
  return { ok: true, vin, modelYearCandidates: candidates };
}
```

Self-check: the regulation's worked example (§565.15 Table VI) yields `4`; `1HGCM82633A004352` → `3` (matches), `1G1ZT53826F109149` → `2` (matches).

---

## 2. NHTSA vPIC

### Endpoints

| Endpoint | Use |
|---|---|
| `GET /api/vehicles/DecodeVinValues/{VIN}?format=json[&modelyear=YYYY]` | Flat key/value decode — **the one to use**. |
| `GET /api/vehicles/DecodeVinValuesExtended/{VIN}?format=json` | Same 154 keys; additionally fills NCSA fields (`NCSABodyType`, `NCSAMake`, `NCSAModel`, …) used by NHTSA crash statistics. Not useful for us. |
| `POST /api/vehicles/DecodeVINValuesBatch/` body `format=json&data=VIN[,MY];VIN[,MY]…` | Up to **50 VINs** per request; same flat result per VIN. Useful only for back-fill/re-decode jobs. |
| `GET /api/vehicles/DecodeVin/{VIN}` | Non-flat (one row per variable) — more verbose, no benefit. |

- Partial VINs with `*` wildcards are accepted (e.g. `5UXWX7C5*BA`). Not needed.
- NHTSA recommends always passing `modelyear` when known; it changes which year ranges are used for decoding (relevant for pre-2010 ambiguity).
- `GET /api/vehicles/GetVehicleVariableValuesList/Error%20Code?format=json` returns the full error-code list (below).

### Operational facts

- Free, **no API key, no registration**, "no limit to the amount of actions … per day" (FAQ). An "automated traffic rate control mechanism" exists (docs) but thresholds are **not published**; FAQ cites capacity of ~1,000–2,000 transactions/min and asks that batch jobs run at night (EST) or weekends. Third-party reports of HTTP 429 above ~5 req/s are unverified.
- Availability: "up 24/7 minus an occasional need for maintenance", target 99 % during business hours (6 AM–6 PM EST), maintenance usually on weekends. Treat as best-effort; plan for downtime.
- Response headers: `cache-control: no-cache`, `expires: -1` — NHTSA gives no HTTP caching hints; caching is our policy.
- The data is **not strictly static**: manufacturers keep submitting VIN-decoding data and the site shows "Last Code Change 10/17/2026". A VIN decoded today may decode with more fields later, but the core values (make, model, year) do not change in practice.
- Latency observed: ~0.3 s per decode.
- Every response carries `Message`: "Any missing decoded values should be interpreted as NHTSA does not have data on the specific variable." → empty string = unknown, never "absent feature".
- A standalone vPIC database is downloadable (docs link "Standalone vPIC Databases"); a self-hosted decoder is possible but out of proportion for v1.

### Response shape

`{ Count, Message, SearchCriteria, Results: [ { …154 string keys… } ] }`. All values are **strings**; unknown = `""`. Key fields:

| Field | Example | Keep? |
|---|---|---|
| `ErrorCode` | `"0"`, `"1"`, `"6,7,11"` (comma-separated list) | Decision input, not stored as a column (maybe in raw payload). |
| `ErrorText`, `AdditionalErrorText` | human text | Show/log only. |
| `SuggestedVIN` | `"1HGCM8263!A004352"` (`!` marks the bad position) | Could power "did you mean" — low value. |
| `Make` | `"HONDA"` (uppercase) | **Yes** — needs display casing (`Honda`) or keep raw + format in UI. |
| `Model` | `"Accord"` | **Yes** |
| `ModelYear` | `"2003"` | **Yes** (integer) |
| `Trim` / `Series` | `"EX-V6"` / often empty | **Yes** (nullable) |
| `BodyClass` | `"Coupe"`, `"Pickup"`, `"Sedan/Saloon"` | **Yes** (nullable) |
| `VehicleType` | `"PASSENGER CAR"`, `"TRUCK"`, `"MOTORCYCLE"` | Yes (nullable) — could drive icons / catalog relevance. |
| `EngineCylinders`, `DisplacementL` | `"6"`, `"2.998832712"` | Yes (nullable) — round displacement to 1 decimal for display. |
| `FuelTypePrimary`, `ElectrificationLevel` | `"Gasoline"`, `"Electric"`, `"BEV (Battery Electric Vehicle)"` | **Yes** — matters for service catalog (EVs have no oil changes). |
| `DriveType` | `"4WD/4-Wheel Drive/4x4"`, often `""` | Yes (nullable). |
| `TransmissionStyle` | `"Automatic"` | Optional. |
| `Manufacturer`, `PlantCountry`, `Doors` | | Not needed (keep in raw payload if stored). |

### Error codes (live list, 2026-10-26)

| Code | Meaning | Our classification |
|---|---|---|
| 0 | VIN decoded clean. Check digit is correct | **Success** |
| 1 | Check digit (9th position) does not calculate properly | **Typo signal** — vPIC still returns make/model/year from the WMI/VDS pattern (see samples). |
| 2 | VIN corrected, error in one position | Warning/typo |
| 3 | VIN corrected, error in one position (assuming check digit is correct) | Warning/typo |
| 4 | VIN corrected, error in one position only (`!` in SuggestedVIN), multiple matches | Typo |
| 5 | VIN has errors in few positions | Failure |
| 6 | Incomplete VIN | Failure (our local check catches it first) |
| 7 | Manufacturer not registered with NHTSA for sale/import in the US | **Not a US-market vehicle** → no decode; manual entry |
| 8 | No detailed data available currently | Partial / no data → manual entry |
| 9 | Glider warning | Edge; treat as warning |
| 10 | Off-road vehicle warning (not an FMVSS motor vehicle) | Edge; treat as warning |
| 11 | Incorrect model year — position 10 invalid (I O Q U Z 0) | Failure (local check catches it) |
| 12 | Model year entered does not match position 10 | Warning (only when we pass `modelyear`) |
| 14 | Unable to provide information for some characters | **Warning** — decoded partially |
| 400 | Invalid characters present | Failure (local check catches it) |

Important: **vPIC always answers HTTP 200** for decode requests, even for garbage input; failure is only visible in `ErrorCode`. And it **decodes VINs with a wrong check digit** — a typo in positions 10–17 (serial number) still yields a plausible Honda Accord. So vPIC success ≠ VIN valid; the local check digit test is the only protection against typos in the serial section.

### Real samples (trimmed to key fields)

`GET /api/vehicles/DecodeVinValues/1HGCM82633A004352?format=json` — valid, 2003 Honda Accord:

```json
{
  "Count": 1,
  "Message": "Results returned successfully. NOTE: Any missing decoded values should be interpreted as NHTSA does not have data on the specific variable. Missing value should NOT be interpreted as an indication that a feature or technology is unavailable for a vehicle.",
  "SearchCriteria": "VIN(s): 1HGCM82633A004352",
  "Results": [{
    "ErrorCode": "0",
    "ErrorText": "0 - VIN decoded clean. Check Digit (9th position) is correct",
    "AdditionalErrorText": "", "SuggestedVIN": "",
    "Make": "HONDA", "Model": "Accord", "ModelYear": "2003", "Trim": "EX-V6", "Series": "",
    "BodyClass": "Coupe", "VehicleType": "PASSENGER CAR",
    "EngineCylinders": "6", "DisplacementL": "2.998832712",
    "FuelTypePrimary": "Gasoline", "ElectrificationLevel": "", "DriveType": "",
    "TransmissionStyle": "Automatic", "Manufacturer": "AMERICAN HONDA MOTOR CO., INC.",
    "PlantCountry": "UNITED STATES (USA)", "Doors": "2", "VIN": "1HGCM82633A004352"
  }]
}
```

`5YJ3E1EA2KF317000` — valid, 2019 Tesla Model 3 (EV: empty engine fields):

```json
{ "ErrorCode": "0", "Make": "TESLA", "Model": "Model 3", "ModelYear": "2019", "Trim": "",
  "BodyClass": "Sedan/Saloon", "EngineCylinders": "", "DisplacementL": "",
  "FuelTypePrimary": "Electric", "ElectrificationLevel": "BEV (Battery Electric Vehicle)", "DriveType": "" }
```

`1FTFW1ET9DFC10312` — valid, 2013 Ford F-150 (decoded clean but with a year caveat):

```json
{ "ErrorCode": "0",
  "AdditionalErrorText": "The Model Year decoded for this VIN may be incorrect. If you know the Model year, please enter it and decode again to get more accurate information.",
  "Make": "FORD", "Model": "F-150", "ModelYear": "2013", "Trim": "", "BodyClass": "Pickup",
  "EngineCylinders": "6", "DisplacementL": "3.5", "FuelTypePrimary": "Gasoline", "DriveType": "4WD/4-Wheel Drive/4x4" }
```

`1HGCM82633A004353` — **one-character typo** in the serial (check digit fails), still fully decoded:

```json
{ "ErrorCode": "1", "ErrorText": "1 - Check Digit (9th position) does not calculate properly",
  "Make": "HONDA", "Model": "Accord", "ModelYear": "2003", "Trim": "EX-V6", "BodyClass": "Coupe" }
```

`1HGCM8263QA004352` — `Q` in position 10:

```json
{ "ErrorCode": "1,11,400",
  "ErrorText": "1 - Check Digit (9th position) does not calculate properly; 11 - Incorrect Model Year - Position 10 does not match valid model year codes (I, O, Q, U, Z, 0). Decoded data may not be accurate.; 400 - Invalid Characters Present",
  "AdditionalErrorText": "Invalid character(s): 10:Q.", "SuggestedVIN": "1HGCM8263!A004352",
  "Make": "HONDA", "Model": "Accord", "ModelYear": "", "Trim": "EX" }
```

`ABC123` — garbage (HTTP 200 nonetheless):

```json
{ "ErrorCode": "6,7,11",
  "ErrorText": "6 - Incomplete VIN; 7 - Manufacturer is not registered with NHTSA for sale or importation in the U.S. for use on U.S roads; Please contact the manufacturer directly for more information; 11 - Incorrect Model Year - Position 10 does not match valid model year codes (I, O, Q, U, Z, 0). Decoded data may not be accurate.",
  "Make": "", "Model": "", "ModelYear": "" }
```

Other observations:

- `1HGCM82633A0043521` (18 chars) returned `ErrorCode "0"` — vPIC silently ignores extra characters. Length must be enforced locally.
- `ZZZZZZZZZZZZZZZZZ` → `1,7,11,400`, with `AdditionalErrorText: "Invalid character(s): 9:Z, 10:Z, 14:Z, 15:Z, 16:Z, 17:Z."` — vPIC enforces the numeric tail (positions 14–17).
- Batch call `data=1HGCM82633A004352;5YJ3E1EA2KF317000,2019` returned `Count: 2` with the same flat shape per VIN.
- Extended vs plain for the Honda: identical keys; only `NCSABodyType`, `NCSAMake`, `NCSAModel` were filled in Extended.

---

## 3. App direct vs proxied through our API

| | App calls vPIC directly | API proxies vPIC (`GET /vin/{vin}/decode` or decode inside `POST /vehicles`) |
|---|---|---|
| Rate limiting | Per-phone IP; never an issue | All traffic from one server IP; at hobby scale (a few decodes per Owner, ever) far below 1–2k/min |
| Caching | Per device only | Shared cache across Owners (same VIN decoded once) and re-decodable later |
| Contract | App coupled to 154-key vPIC shape and its quirks (HTTP 200 errors, uppercase makes) | API maps vPIC to our own small DTO; one place to change if we switch provider |
| Trust | API must re-validate/accept whatever the app says | API is the authority for decoded data stored on the vehicle |
| Offline | Both need network; with local-first sync (open topic) the app could queue a vehicle with VIN and decode later | |
| Testability | Hard to fake in e2e | Fake adapter (port/adapter) in API tests; app tests just mock our endpoint |

**Recommendation: proxy through the API**, behind a `VinDecoder` port with a vPIC adapter (timeout ~5 s, one retry with backoff on 5xx/429/timeouts, no retries on 200-with-errors). The app never talks to vPIC.

### Caching strategy

- Table `VinDecode` keyed by normalized VIN (global, not per Owner — decode data is public vehicle-spec data, not personal): `vin`, `errorCodes`, mapped fields, `rawPayload` (jsonb, full 154 keys for future fields), `decodedAt`, `source = 'vpic'`.
- Cache successful decodes (codes 0 / 14 / warnings) with long TTL (e.g. 180 days) or indefinitely with a manual re-decode; cache "not US / no data" (7, 8) shorter (e.g. 7 days) since manufacturers submit data late; never cache transport failures.
- Vehicle rows **copy** the chosen make/model/year/etc. (user-editable), they do not reference the cache — so re-decoding never silently changes a user's vehicle.
- Privacy note: a VIN alone is not PII in US law, but VIN + Owner's service history is personal-ish data. A global decode cache keyed by VIN does not link to an Owner, which is fine; the Owner's `Vehicle.vin` already lives server-side per ADR-0001.

---

## 4. RECOMMENDED policy (for the human to confirm)

1. **VIN is optional.** A Vehicle can be created with VIN, or manually (make, model, year required; trim etc. optional). Reasons: pre-1981 cars, gray-market imports (no check digit), vPIC downtime, users who don't have the VIN at hand. VIN can be added later; adding it later triggers decode but **does not overwrite** user-entered fields without confirmation.
2. **Normalization:** strip whitespace and dashes, uppercase. Store the normalized form only.
3. **Strict validation when a VIN is given:** 17 chars, allowed alphabet (no I/O/Q), valid year code at position 10, **check digit must match**. Reject with a specific message per reason (`LENGTH`, `INVALID_CHARACTERS`, `INVALID_YEAR_CODE`, `CHECK_DIGIT` → "This VIN doesn't look right — check for typos, e.g. 0 vs D, 8 vs B, 5 vs S"). Strict is defensible because v1 is US-market only and every US-market vehicle from the 1981 model year onward carries a valid check digit; a failing check digit means a typo in >99 % of cases, and vPIC would otherwise happily decode the typo.
   - Escape hatch for the rare legit exception (pre-1981, 591.5(f) import): don't let the VIN through unchecked — instead let the user **save the vehicle without a VIN** (manual entry). Optionally a free-text "Other identifier / legacy VIN" field later (open question).
   - Do **not** enforce the position-13–17 numeric rule or the position-7 rule as hard errors (heavy trucks, motorcycles, low-volume makers differ); vPIC reports those.
4. **Decode flow (API):** validate → cache lookup → vPIC `DecodeVinValues` → map:
   - Codes `0` (possibly with `AdditionalErrorText`) or `14`/`9`/`10`/`12` only: **decoded** — pre-fill the form; user confirms/edits before saving.
   - Contains `7` or `8`, or `Make`/`Model`/`ModelYear` empty: **not decodable** — "We couldn't find details for this VIN" → manual entry with VIN kept.
   - Contains `1`–`6`, `11`, `400`: cannot happen after local validation (except vPIC disagreeing); treat as not decodable, log it.
   - vPIC timeout / 5xx / 429: **decode unavailable** — keep the VIN, let the user fill manually now or retry; optionally re-try decode later in the background.
   - The year: trust vPIC's `ModelYear`; if empty, offer the local candidates from position 10 (+ position 7) as a picker.
5. **Uniqueness:** a VIN is **unique per Owner** (`@@unique([ownerId, vin])`, nullable `vin`, Postgres treats NULLs as distinct). Duplicate → "This vehicle is already in your garage" with a link to it. **Not** globally unique: with no auth, two Owners (e.g. household members on separate phones, or old/new phone before a transfer) may legitimately hold the same VIN, and a global constraint would leak "someone else has this VIN".
6. **Where validation lives:** a small **shared TypeScript package** (e.g. `packages/vin`) with `normalizeVin`, `validateVin`, `computeCheckDigit`, `modelYearCandidates` — pure, no dependencies, unit-tested against the CFR worked example and real VINs. The app uses it for instant inline feedback (and to enable the "Decode" button); the API uses it as the authoritative check (in the DTO/Zod schema) before calling vPIC. vPIC mapping lives **only** in the API.
7. **Stored on Vehicle:** `vin?`, `make`, `model`, `modelYear`, `trim?`, `bodyClass?`, `vehicleType?`, `fuelType?`, `electrificationLevel?`, `engineCylinders?`, `displacementL?`, `driveType?`, `nickname?` (user label to tell two similar cars apart), `decodeSource` (`vpic` | `manual`). Store vPIC raw payload only in the decode cache.
8. **Multiple vehicles:** no limit beyond a sane cap (e.g. 50 per Owner) to bound abuse of an unauthenticated API.

---

## 5. Open questions for the human

1. Is VIN **optional** (recommended) or **required** to add a vehicle? If required, pre-1981 / imported vehicles cannot be tracked.
2. **Strict check digit** (recommended: reject, fall back to "add without VIN") vs **soft** (warn "this VIN may have a typo" but allow saving).
3. Which decoded fields are shown/editable in v1 (minimum: make, model, year, trim; nice: fuel/EV, engine, drive type)?
4. May the user **edit** decoded make/model/year (recommended yes), and should a later VIN re-decode ever overwrite manual edits?
5. VIN uniqueness **per Owner only** (recommended) — confirm that two Owners holding the same VIN is acceptable.
6. Should the app offer **VIN scanning** (camera barcode on door jamb / OCR of windshield plate) in v1, or typing/pasting only?
7. Should the server enforce a **vehicle cap per Owner**, and what number?
8. Cache TTLs and whether a "Refresh vehicle details" action exists.

## 6. Newly surfaced questions (may deserve their own tickets)

- **VIN capture UX:** barcode scanning (Code 39 / Data Matrix on door-jamb label, `expo-camera` barcode support) vs OCR vs manual entry — feasibility research.
- **Abuse/rate limiting of our own API** without auth: an open decode proxy could be used as a free vPIC relay; needs throttling per Device ID / IP (ties to the API deployment ticket).
- **Vehicle fields feeding the service catalog:** fuel type / electrification determines which services apply (no oil change for BEVs) — link to the service-catalog ticket.
- **Offline add-vehicle:** if local-first sync is chosen, decode must be deferrable (vehicle saved with VIN, decoded when online).
- **Vehicle deletion vs VIN reuse:** deleting a vehicle and re-adding the same VIN (soft-delete would collide with the unique constraint).
