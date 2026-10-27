# VIN validation and decoding policy

Type: research
Status: resolved
Blocked by: 02

## Question

How strictly should a VIN be validated (format only vs mandatory check digit) given the v1 market is the US (US-market vehicles, see Market, language, currency and units), and how well does NHTSA vPIC decode vehicles sold in that market? Which decoded fields do we keep, what happens when decoding fails or vPIC is down, is VIN required at all, and is it unique per install?

## Answer

Resolved 2026-10-26 (research). Full findings, algorithm, real vPIC samples and rationale: [VIN validation and decoding](../research/vin-validation-and-decoding.md).

**Key facts**
- US-market VINs (49 CFR 565, MY1981+): 17 chars, no `I`/`O`/`Q`, position 10 year code never `U`/`Z`/`0`, mandatory check digit at position 9 (Table III values × weights `8765432 10 0 98765432`, mod 11, 10 → `X`). Position 7 alpha/numeric picks the 2010–2039 vs 1980–2009 cycle for light vehicles from MY2010. Pre-1981 VINs are free-form; gray-market imports (591.5(f)) are exempt from the check digit.
- NHTSA vPIC `DecodeVinValues` is free, keyless, no published rate limit (~1–2k tx/min capacity, best-effort uptime). It always returns HTTP 200; outcome is in a comma-separated `ErrorCode` (`0` clean, `1` bad check digit, `7` not a US-market maker, `8` no data, `14` partial, …). It **decodes VINs with a wrong check digit** and ignores extra characters, so it cannot replace local validation.

**Recommendation (not decided)**
- VIN **optional**; manual make/model/year entry always available (pre-1981, imports, vPIC down, decode not found).
- Normalize (strip spaces/dashes, uppercase); **strict** local validation incl. check digit when a VIN is given; fall back to "add without VIN" instead of accepting a bad one.
- Validation in a shared pure TS package used by app (inline feedback) and API (authoritative). Decoding **proxied through the API** behind a `VinDecoder` port, with a global VIN decode cache (long TTL for hits, short for "no data", none for outages); vehicle rows copy decoded values, user can edit before saving.
- Keep: make, model, model year, trim, body class, vehicle type, fuel type / electrification, cylinders, displacement, drive type.
- VIN unique **per Owner** (nullable, `@@unique([ownerId, vin])`), not globally.

**Open questions for the human**
1. VIN optional (recommended) or required?
2. Strict check digit (recommended) or warn-and-allow?
3. Which decoded fields to show/edit in v1?
4. May users edit decoded data, and may a later re-decode overwrite edits?
5. Uniqueness per Owner only — OK that two Owners hold the same VIN?
6. VIN scanning (barcode/OCR) in v1 or typing only?
7. Vehicle cap per Owner, and what number?
8. Decode cache TTLs / "refresh details" action?
