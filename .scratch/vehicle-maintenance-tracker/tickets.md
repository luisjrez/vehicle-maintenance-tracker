# Tickets: Vehicle maintenance tracker v1

Tracer-bullet slices that build the v1 described in [PRD.md](PRD.md) (decisions in ADR-0001…0009, terms in CONTEXT.md). Every ticket is `Status: ready-for-agent`; use TDD for the pure rules in the shared package, write all code, copy and docs in English, and pin the exact versions of ADR-0005.

Work the **frontier**: any ticket whose blockers are all done. Tickets 12–15 (scanner) can run in parallel with 3–11.

## 1. API walking skeleton

Status: done

**What to build:** A fresh git repository with a Bun-workspaces monorepo (isolated installs) holding the API app and the framework-free shared package. The NestJS 12 API runs on Node 24 and answers a versioned health check that proves it reaches PostgreSQL 18 through Prisma 7.10.1 (pg adapter). Local dev runs entirely from docker-compose (Postgres, one-off migrate service, API); a separate test compose provides an isolated Postgres for integration tests. CI runs lint, typecheck, tests and the Docker build.

**Blocked by:** None — can start immediately.

- [x] Git repo initialized; Bun workspaces with the API app and the shared package; TypeScript ~6.0.3 everywhere; exact pins per ADR-0005
- [x] `GET /v1/health` returns OK only when the database is reachable
- [x] Multi-stage Docker image (build with Bun, run on node:24-slim) starts the API
- [x] Dev compose: Postgres 18 + migrate service (`prisma migrate deploy`) runs before the API
- [x] Test compose with its own Postgres; one Vitest integration test hits the health endpoint against it
- [x] oxlint (type-aware) + typecheck + Vitest + Docker build run in GitHub Actions and go red on failure (workflow written; not yet run — no remote)
- [x] Shared package builds as ESM and is importable by the API

## 2. Mobile walking skeleton

Status: done

**What to build:** The Expo SDK 58 app inside the monorepo, built as a dev build (no Expo Go) for iOS and Android, using Expo Router, that shows whether the API health check succeeds. It imports something from the shared package to prove the workspace wiring.

**Blocked by:** 1. API walking skeleton

- [x] Expo SDK 58 / RN 0.88 app runs as a dev build on the iOS simulator and an Android emulator
- [x] Metro resolves the shared package in the Bun workspace (isolated installs; fallback to hoisted only if native builds break, documented)
- [x] A screen shows API health (OK / unreachable) using a configurable API base URL
- [x] jest-expo set up with one passing test; oxlint + typecheck for mobile added to CI
- [x] UI strings centralized; `Intl` en-US formatting helpers in place

## 3. Device identity

Status: done

**What to build:** Every request from the app carries the Device ID — `ANDROID_ID` on Android, a Keychain-persisted random UUID on iOS. The API hashes it, never logs it, and creates the Owner and its Device implicitly the first time it sees an unknown Device ID; all later data is scoped to that Owner (ADR-0001). A base per-Device rate limit is in place.

**Blocked by:** 1. API walking skeleton, 2. Mobile walking skeleton

- [x] App obtains the Device ID per platform and sends it as `X-Device-Id` on every request
- [x] iOS: reinstalling the app keeps the same Device ID (Keychain); Android uses `ANDROID_ID` (verified on the iOS simulator: same device hash after uninstall/reinstall; physical iPhone pending)
- [x] API rejects requests without a well-formed Device ID
- [x] API stores only a hash; unknown Device ID → new Owner + Device; known → same Owner
- [x] Device ID never appears in logs (verified by a test) or in the UI
- [x] Base throttling per Device ID (~60 req/min) with a clear 429 error
- [x] Integration tests cover implicit creation and Owner scoping

## 4. Add a vehicle manually + garage home

Status: done

**What to build:** The Owner adds a vehicle without a VIN (year, make, model, trim, required initial odometer, nickname, plate + state, color) from a modal and sees it on the Home screen: the vehicle-switcher carousel with an "Add" tile, the selected vehicle's summary card (current mileage, spend this year), and an empty state ("Add your first vehicle" / "I have data on another phone"). The Owner's data lives in a Zustand store persisted with MMKV and is synced from the API (ADR-0008).

**Blocked by:** 3. Device identity

- [x] Vehicle table + create/list endpoints scoped to the Owner; Zod schemas shared by app and API
- [x] Initial odometer required (0–9,999,999), stamped with the creation date
- [x] Max 20 vehicles per Owner enforced by the API with a clear message
- [x] Home: carousel, selected vehicle summary, empty state; Settings button placeholder
- [x] Display name falls back to "<year> <make> <model>" when no nickname
- [x] Store persisted in MMKV; after a successful create the store updates from the API response
- [x] Integration tests for create/list/cap; component test for the empty state and carousel

## 5. Add a vehicle by VIN

Status: done

**What to build:** In the add-vehicle modal the Owner types or pastes a VIN, gets live validation (normalize; 17 chars; no I/O/Q; valid year code; check digit), and on a valid VIN looks it up: our API decodes it through NHTSA vPIC with a shared server-side cache, the Owner reviews and edits all decoded details, and saves. Invalid VIN → "Add without VIN"; vPIC down or no data → prefilled manual form; never blocks (ADR-0003).

**Blocked by:** 4. Add a vehicle manually + garage home

- [x] VIN normalizer + validator in the shared package, built test-first (valid, wrong check digit, I/O/Q, length, year code)
- [x] `GET /v1/vin/:vin` interprets vPIC `ErrorCode`s; caches hits indefinitely, "no data" ~24 h, never caches outages
- [x] Decoded fields kept: make, model, year, trim, body class, vehicle type, fuel/electrification, cylinders, displacement, drive — all editable before saving
- [x] VIN unique per Owner (not global); duplicate within the same Owner rejected clearly
- [x] VIN decode throttled per Device (~30/hour)
- [x] vPIC mocked in integration tests; one contract test against recorded real responses

## 6. Vehicle details: edit & delete

Status: done

**What to build:** From Home, "Vehicle details & VIN" opens a screen listing every vehicle field and decoded detail; the Owner edits any of them and can delete the vehicle, which hard-deletes it and all its service records after a native confirmation that states how many records will be lost.

**Blocked by:** 4. Add a vehicle manually + garage home

- [x] Read/update/delete vehicle endpoints scoped to the Owner
- [x] All fields editable (including decoded details and VIN under the same validation)
- [x] Delete cascades to records; re-adding the same VIN afterwards works
- [x] Confirmation shows the record count; store updates after the API responds
- [x] Integration tests for edit, cascade delete and cross-Owner isolation

## 7. Log a service record

Status: done

**What to build:** The Owner taps "+" → action sheet → "Log work" and completes a 3-step bottom-sheet wizard: (1) what was done — common-services chips plus a searchable picker over the 14-category / 117-service catalog with "Custom: <name>" (suggesting previously used custom names); (2) date, optional odometer, provider name + type; (3) required total paid, optional per-line cost and notes, record notes. The record appears in the vehicle's history (ADR-0004).

**Blocked by:** 4. Add a vehicle manually + garage home

- [x] Catalog (categories, services, immutable slugs, `retired` flag, typical intervals as data, a few EV/hybrid items) defined in the shared package and seeded into the DB (14 categories, 120 services: the 116 researched — `custom` became the line item's custom name — plus 4 EV/hybrid items)
- [x] Service record + line item tables; line item = catalog slug XOR custom name; optional package code for "Scheduled maintenance"
- [x] Create/list records endpoints; total in integer cents (≥0), `currency = "USD"`, date not in the future, ≥1 line item
- [x] Action sheet (Log work / Add vehicle / Transfer placeholder) and wizard as native sheets
- [x] History list on Home, newest first (services, date, odometer, provider, total)
- [x] Tests: schema rules, seed idempotency, wizard happy path

## 8. Odometer consistency

Status: done

**What to build:** Odometer readings never go backwards in time: a record's odometer must be ≥ the highest reading dated before it and ≤ the lowest dated after it (equal allowed), with the vehicle's initial odometer as a reading on its creation date; violations are rejected in the wizard with an inline message naming the conflicting reading, and by the API. Current mileage is derived, never stored (ADR-0007).

**Blocked by:** 7. Log a service record

- [x] Pure rule in the shared package, built test-first (backfill before creation, same-day equal, records without odometer skipped, editing a record excludes itself)
- [x] API rejects violations with a clear English error; app shows it inline on step 2
- [x] Current mileage derived everywhere it is shown
- [x] Integration test: out-of-order backfilling succeeds when coherent, fails when not

## 9. Record detail, edit & delete

Status: done

**What to build:** Tapping a history entry opens a sheet with the record's total, date, odometer, provider (+type), line items with costs/notes and notes; "Edit" reopens the wizard prefilled with every field editable under the same validations; "Delete" hard-deletes after a native confirmation.

**Blocked by:** 8. Odometer consistency

- [x] Update/delete record endpoints scoped to the Owner, re-running all record rules and odometer consistency
- [x] Record detail sheet, edit via the wizard, delete with confirmation
- [x] Store and history update from API responses
- [x] Tests for edit re-validation and delete

## 10. Spending report

Status: done

**What to build:** The vehicle view shows a basic spending report: year chips (All time + each year with records), the total for the selection, and horizontal per-category bars; the carousel shows each vehicle's spend this year. Line-item costs count toward their service's category; any unallocated remainder of a record's total goes to its first line item's category.

**Blocked by:** 7. Log a service record

- [x] Aggregation as a pure function in the shared package, built test-first (allocated vs unallocated, custom services → Other, year filter)
- [x] Report section and carousel totals formatted en-US
- [x] Component test with a fixture of mixed records

## 11. Offline browsing & resilient writes

Status: done

**What to build:** With no connectivity the Owner can still browse the garage, vehicle details, history and reports from the persisted store; vehicle data refreshes from the API at most once a day; any write without connectivity fails with a clear, retryable error that keeps the form input.

**Blocked by:** 7. Log a service record

- [x] Cold start offline shows the last synced data
- [x] Daily refresh policy for vehicle data; records refreshed on app foreground when online
- [x] Failed writes show an English error with Retry; form state preserved
- [x] Tests simulate offline reads and a failed-then-retried write

## 12. Scanner foundation (QR mode)

Status: ready-for-agent

**What to build:** A full-screen scanner modal with a VIN / Odometer / Transfer QR segmented control, guide box per mode, torch toggle and "Type it instead", built on VisionCamera 5.2.3 + react-native-vision-camera-mlkit 2.0.1 (exact pins, ML Kit bundled on Android, non-Latin text models off, `android.builtInKotlin=false`). This ticket makes QR mode work end-to-end with a debug entry point; other modes show a placeholder (ADR-0006).

**Blocked by:** 2. Mobile walking skeleton

- [ ] One camera session; frame processors never throw; camera permission flow with clear copy
- [ ] QR mode returns the decoded value to the caller; nothing auto-saves
- [ ] Builds on iOS device + x86_64 simulator and Android; known arm64-simulator limitation documented
- [ ] Scanner behind a JS mock so jest-expo tests run without a camera
- [ ] Checked on a physical iPhone

## 13. Transfer to another phone

Status: ready-for-agent

**What to build:** Settings → "Transfer to another phone" shows a QR with a countdown for a single-use, 10-minute transfer code ("Generate a new code" invalidates the previous one) and warns that this phone will lose access. On the new phone, "Receive from another phone" (Settings or the empty state) scans it; if that phone already has data, a red warning states how many vehicles will be deleted and asks for confirmation. Redeeming moves the Owner to the new Device and revokes the old one (ADR-0001).

**Blocked by:** 3. Device identity, 12. Scanner foundation (QR mode)

- [ ] Issue/redeem endpoints; codes stored hashed; expired/used/superseded codes rejected
- [ ] Redeem without confirmation on a phone with data → conflict response with the vehicle count
- [ ] After redeem: new phone sees the data; old phone's next request starts a fresh empty Owner
- [ ] Settings screen with both entries and the "no account" explanation
- [ ] Integration tests for move semantics, replacement and expiry

## 14. Live VIN scanning

Status: ready-for-agent

**What to build:** The scanner's VIN mode reads the windshield VIN plate (live text) and the door-jamb barcode (Code 39 / Code 128 / Data Matrix, stripping a leading "I"), steering the user to the door-jamb sticker first. Candidates are normalized and corrected (I→1, O/Q→0, digits forced in positions 13–17, ambiguous substitutions kept only when the check digit passes) and voted across frames; the result fills the editable VIN field in the add-vehicle modal.

**Blocked by:** 5. Add a vehicle by VIN, 12. Scanner foundation (QR mode)

- [ ] Candidate correction + per-character voting as pure functions in the shared package, built test-first with realistic misreads
- [ ] Barcode path short-circuits OCR when it yields a valid VIN
- [ ] Shutter fallback; "Type it instead" returns to the field
- [ ] Owner always confirms; value goes through the same validator
- [ ] Checked on a physical iPhone against a real windshield plate and door-jamb sticker

## 15. Live odometer scanning

Status: ready-for-agent

**What to build:** The scanner's Odometer mode (wide 2:1 guide, torch off by default) proposes the odometer value: prefers numbers next to ODO / mi / miles, ignores TRIP, temperature, clock, range, mpg and %, drops tenths, ranks by plausibility against the consistency bounds without hiding candidates, and locks when stable (≥3 frames, ≥60 % of ~1.5 s; two close candidates → offer both). After ~6 s without a lock it offers typing or a photo; "km" next to the number → warn and offer conversion to miles. Available from the add-vehicle initial odometer and the wizard's step 2.

**Blocked by:** 8. Odometer consistency, 12. Scanner foundation (QR mode)

- [ ] Candidate picker and stability lock as pure functions in the shared package, built test-first
- [ ] km detection + confirmed conversion; bounds 0–9,999,999
- [ ] Result fills the editable odometer field; consistency rule still applies
- [ ] Checked on a physical iPhone with at least one digital cluster

## 16. Abuse limits & production deploy

Status: ready-for-agent

**What to build:** Final abuse protection for the unauthenticated API (≤10 new Owners per IP per hour, VIN decode and per-Device limits tuned, request bodies ≤100 KB) and v1 shipped to its two environments: the API image + managed Postgres on the chosen Docker PaaS (Railway or Fly.io) with migrations on deploy, and EAS builds distributed via TestFlight and Android internal testing (ADR-0009).

**Blocked by:** 5. Add a vehicle by VIN, 13. Transfer to another phone

- [ ] Throttling keyed by Device ID and IP, with integration tests for each limit
- [ ] Body size limit enforced
- [ ] Production API reachable over HTTPS with secrets outside the repo; migrations run on deploy
- [ ] EAS build profiles for internal distribution; a TestFlight build installs and talks to production
- [ ] Short runbook: deploy, roll back, rotate secrets
