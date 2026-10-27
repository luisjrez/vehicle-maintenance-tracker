# Vehicle maintenance tracker — map

Label: wayfinder:map

## Destination

A v1 spec (PRD) for the vehicle maintenance tracker — domain, flows, service catalog and stack decided — ready to hand to `/to-tickets` and start implementation. No code is written on this map.

## Notes

- Product: Expo mobile app (Bun as package manager) + small NestJS API (Docker image) + Postgres + Prisma. No authentication.
- Core flows (candidate): Garage (vehicle list + add vehicle by VIN with validation/decoding), Log work (any service: maintenance, paint, detailing, tires…), Vehicle log (history + cost totals), edit/delete.
- Skills each session should consult: `/grilling` + `/domain-modeling` for grilling tickets, `/research` for research tickets, `/prototype` for prototype tickets.
- Standing preferences: code and docs in English, conversation in Spanish; target latest STABLE versions (verify with web search); grill → spec → tickets before any implementation.
- Initial research (2026-10-26): VIN check digit (pos. 9) mandatory in North America only, not in ISO 3779/EU; NHTSA vPIC `DecodeVinValues` is free, keyless, rate-limited, MY1981+, US-market coverage; no industry-standard service list exists (dealer menus are packages, e.g. Honda Maintenance Minder A/B); NestJS 12 stable; Prisma 8 still RC (7.10.x stable, pin it).

## Decisions so far

<!-- one line per closed ticket -->

- [Data ownership without authentication](issues/01-data-ownership-without-auth.md) — `X-Device-Id` (ANDROID_ID / Keychain UUID), hashed; Owner↔Device model; QR transfer code in v1 moves the Owner and revokes the old phone.
- [Market, language, currency and units](issues/02-market-locale-currency-units.md) — US market, English everywhere, fixed USD (integer cents + `currency` column) and miles, `en-US` formatting, no i18n lib.
- [Standard service catalog](issues/03-standard-service-catalog.md) — no US standard; draft of 14 categories / 117 services with slugs and indicative intervals ([asset](research/service-catalog.md)); usage decisions pending.
- [VIN validation and decoding policy](issues/04-vin-validation-and-decoding-policy.md) — recommend optional VIN, strict check digit, shared validator, vPIC decode proxied + cached by the API, per-Owner uniqueness ([asset](research/vin-validation-and-decoding.md)); decisions pending.
- [Stack versions and repo shape](issues/07-stack-versions-and-repo-shape.md) — Expo SDK 58, RN 0.88, NestJS 12.2, Prisma 7.10.1 (8 still RC), Postgres 18, Bun 1.4, Node 24, TS 6.0; Bun workspaces apps/mobile + apps/api + packages/shared ([asset](research/stack-and-repo-shape.md)); decisions pending.
- [VIN policy decisions](issues/08-vin-policy-decisions.md) — VIN optional; strict validation, reject + "Add without VIN"; show all decoded details, editable before/after save; same VIN across Owners OK; type or OCR scan; max 20 vehicles; API vPIC cache + app MMKV refreshed daily.
- [VIN camera scanning approach](issues/11-vin-camera-scanning-approach.md) — recommend `expo-camera` only (QR + door-jamb barcodes) + photo-capture OCR via a small in-repo Expo module (iOS Vision / Android ML Kit v2), VIN candidate correction in `packages/shared`; live scanning later ([asset](research/vin-camera-scanning.md)); decisions pending.
- [Service catalog decisions](issues/09-service-catalog-decisions.md) — full 117-service list as typed constant in `packages/shared`, seeded to DB; immutable slugs + `retired`; fixed categories; no packages (optional package code); quick-pick of ~8; no intervals/reminders in v1.
- [Stack and toolchain decisions](issues/10-stack-and-toolchain-decisions.md) — Prisma 7.10.1 pinned, Node 24 runtime (Bun = package manager), isolated installs, Zod schemas in shared, Vitest + jest-expo, oxlint, migrate service + separate test compose.
- [VIN scanning decisions](issues/12-vin-scanning-decisions.md) — live scanning on both platforms in v1 (text + door-jamb barcode + QR, one scanner screen), existing library if viable else custom native module, ML Kit bundled.
- [Live VIN scanner feasibility spike](issues/13-live-vin-scanner-spike.md) — VisionCamera 5.2.3 + react-native-vision-camera-mlkit 2.0.1 compile on iOS device/x86_64 sim and Android with no patches (arm64 sim unsupported by ML Kit); replaces expo-camera; on-device behavior unverified ([asset](research/live-vin-scanner-spike.md)).
- [Domain model](issues/05-domain-model.md) — Service record = visit with line items (total required, line cost optional); Vehicle with required initial odometer, derived current mileage; odometer consistency by date, rejected on violation; custom services free text; provider type; hard deletes.
- [Odometer scanning approach](issues/15-odometer-scanning-approach.md) — recommend same scanner in text-only odometer mode, shared candidate picker (ODO/mi anchors, ignore TRIP), multi-frame lock, always confirm; ML Kit weak on seven-segment LCDs ([asset](research/odometer-scanning.md)); decisions pending.
- [v1 scope edges: reports, attachments, offline writes](issues/16-v1-scope-edges.md) — basic per-vehicle cost reports; no receipt photos; server is source of truth, app mirrors it in a Zustand store persisted with MMKV, writes need connectivity.
- [Odometer scanning decisions](issues/18-odometer-scanning-decisions.md) — ML Kit only, live auto-lock + shutter, always confirm; km → warn + convert; whole miles 0–9,999,999; iPhone-only device test before spec locks; no LLM fallback.
- [API operations](issues/17-api-operations.md) — throttler by Device ID + IP (cap new Owners per IP), Docker PaaS (Railway/Fly.io) local + prod, local dev builds + EAS for TestFlight, GitHub Actions CI, stay on ADR-0005 pins.
- [Flows and screens](issues/06-flows-and-screens.md) — prototype variant B: vehicle switcher home, "+" action sheet, 3-step log-work wizard; lean on native bottom sheets/modals ([prototype](prototypes/flows-prototype.html?variant=B)).
- [Live scanner device validation](issues/14-live-scanner-device-validation.md) — signed Release build on the user's iPhone 17 Pro Max works "relatively well in most cases"; spec commits to VisionCamera + ML Kit plugin, custom module as fallback.

## Not yet specified

Nothing — the frontier is empty. **Destination reached:** [PRD.md](PRD.md) (v1 spec) assembled 2026-10-26; next step is `/to-tickets`.

## Out of scope

- User accounts / login.
- Sharing vehicles between people.
- Multi-device access for one Owner (transfer moves, never links) and recovery without the old phone — accepted data loss, see [Data ownership without authentication](issues/01-data-ownership-without-auth.md).
- Integration with shops/dealers, payments.
- Receipt/invoice photos and offline write queue — see [v1 scope edges](issues/16-v1-scope-edges.md).
- Service reminders / next-due intervals and non-service costs (fuel, insurance, tolls) — v1 is logging + viewing, see [Service catalog decisions](issues/09-service-catalog-decisions.md).
- Public App Store / Play Store release, staging environment, dependency upgrade plan — see [API operations](issues/17-api-operations.md).
- Markets other than the US (Mexico, metric units, other currencies, translations) — v1 is US-only, see [Market, language, currency and units](issues/02-market-locale-currency-units.md).
