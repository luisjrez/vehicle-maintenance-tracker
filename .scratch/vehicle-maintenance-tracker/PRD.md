# PRD — Vehicle maintenance tracker (v1)

Status: ready for `/to-tickets` · Date: 2026-10-26
Source of truth for every decision below: the [wayfinder map](map.md) and its resolved tickets, the ADRs in [`docs/adr/`](../../docs/adr/), and the glossary in [`CONTEXT.md`](../../CONTEXT.md). This document assembles them; where it summarizes, the linked ticket/ADR wins.

## 1. Problem and goal

Car owners lose track of what was done to their vehicles, when, at what mileage, and how much it cost. v1 is a mobile app where an owner registers their vehicles (by VIN or manually) and logs **any** work done on them — maintenance, repairs, tires, paint, detailing, inspections — with dates, odometer and costs, then reviews each vehicle's history and spending.

## 2. Scope

**In v1**
- US market only, English everywhere, USD, miles ([ADR-0002](../../docs/adr/0002-usd-cents-and-miles.md)).
- No login: anonymous Owner identified by a Device ID; device-to-device transfer by QR ([ADR-0001](../../docs/adr/0001-device-identity-without-auth.md)).
- Vehicles: add by VIN (typed or live-scanned, validated, decoded via NHTSA vPIC through our API) or manually; up to 20 per Owner ([ADR-0003](../../docs/adr/0003-vin-policy.md)).
- Service records: one visit with one or more line items from a 117-service catalog or custom ([ADR-0004](../../docs/adr/0004-service-catalog.md)).
- Odometer consistency by date ([ADR-0007](../../docs/adr/0007-odometer-consistency.md)); live odometer scanning.
- Basic per-vehicle cost reports.
- Offline reading from a local mirror; online-only writes ([ADR-0008](../../docs/adr/0008-server-source-of-truth-local-store.md)).

**Out of v1** (see map › Out of scope): accounts/login; multi-device access and recovery without the old phone; sharing vehicles; service reminders/intervals; fuel, insurance, tolls; receipt photos; offline write queue; shop integrations and payments; markets other than the US; public store release; staging; dependency upgrades beyond the fixed pins.

## 3. Domain (summary — full terms in `CONTEXT.md`)

- **Owner** — anonymous holder of all data. Has exactly one active **Device**.
- **Device** — identified server-side by the hash of the **Device ID** sent in `X-Device-Id` (Android `ANDROID_ID`; iOS UUID kept in the Keychain).
- **Transfer code** — single-use, 10-minute code shown as a QR; redeeming moves the Owner to the new Device and revokes the old one.
- **Vehicle** — make/model/year (required), optional VIN (unique per Owner only) + decoded details, nickname, plate/state, color, **required initial odometer** dated at creation. **Current mileage** is derived (max of all readings).
- **Service record** — a visit on a date: optional odometer, optional provider (name + type: Dealer / Chain / Independent shop / DIY), notes, **required total paid** (integer cents, `$0` allowed), `currency = "USD"`.
- **Line item** — a catalog service (immutable slug) **or** a custom name; optional cost and notes.
- **Catalog service / category** — fixed catalog in `packages/shared`; services can be `retired`, never renamed.

## 4. User flows (UI direction: prototype variant B, native sheets — [Flows and screens](issues/06-flows-and-screens.md))

### 4.1 First launch
- Empty state: **Add your first vehicle** / **I have data on another phone** (→ 4.7 receive).
- The Device ID is created/read silently; the API creates Owner + Device on first sight.

### 4.2 Home — vehicle switcher
- Header: "My cars" + Settings button.
- Horizontal carousel of vehicles (nickname/make, year model, current mileage) + "Add" tile; one vehicle selected at a time.
- Selected vehicle: summary card (name, trim, plate, current mileage, spend this year), "Vehicle details & VIN" row, Spending report (4.6), History list (newest first: services, date, odometer, provider, total).
- Floating **+** → action sheet: Log work · Add vehicle · Transfer to another phone.

### 4.3 Add vehicle (modal)
1. **VIN step**: VIN field with live validation feedback (normalize: trim, strip spaces/dashes, uppercase; 17 chars; no I/O/Q; valid year code; check digit). **Scan** opens the scanner (4.8, VIN mode). Valid → **Look up vehicle**. Invalid or no VIN → **Add without VIN**.
2. **Review** (decoded) or **Manual** form: year*, make*, model*, trim, decoded details (body class, vehicle type, fuel/electrification, cylinders, displacement, drive — all shown and editable), **current odometer*** (type or scan, 4.8 Odometer mode), nickname, plate + state, color.
3. Save → vehicle selected on Home. Over 20 vehicles → blocked with a clear message.
- If vPIC has no data or is down: show the manual form prefilled with what is known; never block adding.

### 4.4 Log work (bottom-sheet wizard, 3 steps)
1. **What was done?** Common-services chips (oil change, tire rotation, front brake pads, battery, new tires, full detailing, state inspection, wiper blades) + **Search all services** sheet (search across 117 services, browse 14 categories, or "Custom: <typed name>", suggesting the Owner's previous custom names). ≥1 line item required.
2. **When & where?** Date (not in the future), odometer (optional; type or scan) with inline **consistency error** naming the conflicting reading, provider name + type chips.
3. **What did it cost?** Total paid* (prominent), optional per-line cost, per-line notes, record notes. Save.
- "Scheduled maintenance" line items carry an optional package code (e.g. "Honda A1", "30k service") in their notes/package field.

### 4.5 Record detail / edit / delete (sheet)
- Shows total, date, odometer, provider (+type), line items with cost/notes, notes.
- **Edit** reopens the wizard with all fields editable under the same validations. **Delete** → native confirm → hard delete.

### 4.6 Spending report (inside the vehicle view)
- Year chips: All time + each year with records. Total for the selection. Per-category horizontal bars. Garage carousel shows spend this year per vehicle. No trend charts.
- Category attribution: line-item costs go to their service's category; any remainder of the record total (unallocated) goes to the first line item's category.

### 4.7 Settings & transfer
- **Transfer to another phone** (sheet): QR + countdown, "Generate a new code" (invalidates the previous), warning that this phone loses access.
- **Receive from another phone**: scanner (QR mode) → if this phone already has data: red warning "This phone has N vehicles; they will be deleted and replaced" → confirm → data appears; old phone starts empty next time it opens.
- Copy: "Your data is tied to this phone. There is no account — use transfer when you change phones."

### 4.8 Scanner (full-screen modal, one screen, three modes)
- Segmented control: **VIN · Odometer · Transfer QR**; guide box per mode; torch toggle (off by default); shutter fallback (VIN/Odometer); "Type it instead".
- **VIN mode**: live text recognition (windshield plate) + barcode (door-jamb Code 39 / Code 128 / Data Matrix, strip a leading `I` on 18-char reads). Candidates normalized (I→1, O/Q→0; positions 13–17 forced to digits; ambiguous S/5, B/8, Z/2, G/6, D/0 substitutions kept only if the check digit passes; per-character vote across frames). Steer the user to the door-jamb sticker first.
- **Odometer mode**: text-only, wide 2:1 guide; candidate picker prefers numbers next to `ODO`/`mi`/`miles`, ignores TRIP / temperature / clock / range / mpg / %; drops tenths; ranks by plausibility vs ADR-0007 bounds without hiding candidates; locks when stable (≥3 frames and ≥60 % of a ~1.5 s window; two close candidates → offer both); after ~6 s without a lock offer typing/photo; "km" next to the number → warn and offer conversion to miles with confirmation; bounds 0–9,999,999.
- **QR mode**: transfer code.
- Every scanned value lands in an editable field; the Owner always confirms. Nothing auto-saves.

## 5. Business rules

| Rule | Where enforced |
|---|---|
| VIN normalization + strict validation; invalid VIN rejected | `packages/shared` (app + API) |
| VIN unique per Owner (not global); max 20 vehicles per Owner | API (DB constraint + check) |
| Odometer consistency by date: ≥ highest reading dated before, ≤ lowest reading dated after; initial odometer = reading at vehicle creation; records without odometer skipped; violations rejected | `packages/shared` (app + API) |
| Record: date not in the future; ≥1 line item; total ≥ 0 cents; line item = catalog slug XOR custom name; costs ≥ 0 | `packages/shared` Zod schemas |
| Current mileage derived, never stored | app + API |
| One active Device per Owner; transfer moves, never links | API |
| Transfer code single-use, 10 min TTL, newest code invalidates older ones | API |
| Hard deletes (record; vehicle cascades to records) with confirmation | app (confirm) + API |
| Device ID never logged or displayed; stored only hashed | app + API |

## 6. API (NestJS 12, `/v1`, every request carries `X-Device-Id`)

Contract = Zod 4 schemas in `packages/shared`, validated in NestJS via Standard Schema ([ADR-0005](../../docs/adr/0005-stack-and-toolchain.md)). Sketch (final shapes decided in implementation tickets):

| Method & path | Purpose |
|---|---|
| `GET /v1/vehicles` | Owner's vehicles (with decoded details) |
| `POST /v1/vehicles` | Create (validates VIN, 20-vehicle cap, per-Owner VIN uniqueness, initial odometer) |
| `GET/PATCH/DELETE /v1/vehicles/:id` | Read / edit any field / hard delete (cascade) |
| `GET /v1/vehicles/:id/records` | Records of a vehicle with line items |
| `POST /v1/vehicles/:id/records` | Create record (all record rules, odometer consistency) |
| `PATCH/DELETE /v1/records/:id` | Edit (re-validated) / hard delete |
| `GET /v1/vin/:vin` | Decode via vPIC through the shared server cache |
| `POST /v1/transfer-codes` | Issue a code for the calling Owner (invalidates previous) |
| `POST /v1/transfer-codes/redeem` | Redeem `{ code, replaceExisting }` → `409` with vehicle count if the caller has data and `replaceExisting` is false |

- Owner + Device are created implicitly for an unknown Device ID.
- vPIC: always HTTP 200 — interpret `ErrorCode` (0 clean, 1 check digit, 7/8 no data, 14 partial, 400 invalid). Cache: hits indefinitely, "no data" ~24 h, outages not cached ([vin research](research/vin-validation-and-decoding.md)).
- Abuse protection (`@nestjs/throttler`, keyed by Device ID and IP): ~60 req/min per Device, ≤10 new Owners per IP per hour, VIN decode ~30/hour per Device, bodies ≤100 KB ([ADR-0009](../../docs/adr/0009-api-operations.md)).
- Error messages in English.

## 7. Data model (Prisma 7.10.1, PostgreSQL 18 — indicative)

- `Owner(id, createdAt)`
- `Device(id, ownerId → Owner, deviceIdHash UNIQUE, createdAt)` — revocation deletes the row.
- `TransferCode(id, ownerId, codeHash UNIQUE, expiresAt, usedAt?)`
- `Vehicle(id, ownerId, vin?, make, model, year, trim?, bodyClass?, vehicleType?, fuelType?, electrification?, cylinders?, displacementL?, driveType?, nickname?, plate?, plateState?, color?, initialOdometer, initialOdometerDate, createdAt, updatedAt)`; `UNIQUE(ownerId, vin)` where vin not null.
- `ServiceRecord(id, vehicleId → Vehicle ON DELETE CASCADE, date (date), odometer?, providerName?, providerType? enum, notes?, totalCents int, currency default 'USD', createdAt, updatedAt)`
- `LineItem(id, recordId → ServiceRecord ON DELETE CASCADE, serviceSlug? → CatalogService, customName?, costCents?, notes?, packageCode?)`; check: exactly one of serviceSlug/customName.
- `CatalogCategory(slug PK, name)`, `CatalogService(slug PK, categorySlug, name, description, typicalInterval json?, retired bool)` — seeded from `packages/shared`.
- `VinDecodeCache(vin PK, status, payload json, fetchedAt, expiresAt?)`

## 8. Mobile app

- Expo SDK 58 (RN 0.88, React 19.3), dev builds (no Expo Go), Expo Router with native form sheets / modals.
- State: Zustand store persisted with MMKV mirrors the Owner's data; reads from the store (offline-capable); writes call the API, then update the store from the response; vehicle data refreshed from the API at most once a day. Write failures: clear retryable error, form input preserved.
- Device ID: `expo-application` `getAndroidId()` on Android; Keychain UUID via `expo-secure-store` on iOS.
- Camera: **VisionCamera 5.2.3 + react-native-vision-camera-mlkit 2.0.1** (exact pins), one session for text + barcode + QR, ML Kit bundled on Android, non-Latin text models disabled, `android.builtInKotlin=false`; replaces `expo-camera` ([spike](research/live-vin-scanner-spike.md), [device validation](issues/14-live-scanner-device-validation.md)). Frame processors never throw. Fallback if the library fails: custom Expo module (~9–12 days).
- Formatting with `Intl` `en-US`; UI strings centralized (no i18n library).
- Catalog read from the `packages/shared` bundle (no network).

## 9. Repo, stack and operations ([ADR-0005](../../docs/adr/0005-stack-and-toolchain.md), [ADR-0009](../../docs/adr/0009-api-operations.md))

- Bun workspaces monorepo (isolated installs): `apps/mobile`, `apps/api`, `packages/shared` (ESM, framework-free: VIN validator + OCR candidate correction, odometer candidate picker, odometer consistency, catalog, Zod schemas, money helpers).
- API: NestJS 12.2 on **Node 24**; Bun is package manager only; TypeScript `~6.0.3` everywhere; Prisma 7.10.1 + `@prisma/adapter-pg` exact-pinned.
- Docker: multi-stage image (build with Bun, run on `node:24-slim`); dev compose (Postgres 18 + one-off `prisma migrate deploy` service + API); **separate test compose** with its own Postgres.
- Tests: Vitest (API, incl. against the test Postgres), jest-expo (mobile; scanner behind a JS mock). Lint: oxlint only.
- CI: GitHub Actions — oxlint, typecheck, Vitest, jest-expo, Docker build. EAS builds manual.
- Distribution: local dev builds; EAS Build → TestFlight + Android internal. Deploy: Docker PaaS (Railway or Fly.io) + managed Postgres; environments local + production.
- Initializing the git repository is the first implementation step.

## 10. Risks

- **Scanner library health** (VisionCamera open crash issues, release predates RN 0.88): exact pins, defensive frame processors, real-device QA early; fallback module documented.
- **Android not device-tested** before implementation.
- **Odometer OCR** weak on seven-segment LCDs and mechanical drums → typing fallback is a first-class path.
- **iOS reinstall survival** relies on undocumented Keychain persistence.
- **Data loss** when changing phones without the old one (accepted).
- **Unauthenticated API abuse** bounded by throttling, not prevented.
- vPIC is best-effort; decoding must never block adding a vehicle.

## 11. References

- Research: [service catalog](research/service-catalog.md) · [VIN validation & decoding](research/vin-validation-and-decoding.md) · [stack & repo shape](research/stack-and-repo-shape.md) · [VIN camera scanning](research/vin-camera-scanning.md) · [live scanner spike](research/live-vin-scanner-spike.md) · [odometer scanning](research/odometer-scanning.md)
- UI prototype (throwaway): [flows-prototype.html?variant=B](prototypes/flows-prototype.html)
- ADRs 0001–0009 in [`docs/adr/`](../../docs/adr/); glossary [`CONTEXT.md`](../../CONTEXT.md).
