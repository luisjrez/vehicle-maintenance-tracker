# Vehicle maintenance tracker

An iOS and Android app for keeping a record of everything done to your cars: what was serviced, when, at what mileage and what it cost. It comes with a NestJS API and a shared package that holds the domain rules both sides use.

- **No accounts.** Each phone has a Device ID; moving to a new phone is a one-time QR transfer.
- **VIN entry by camera or keyboard.** VINs are validated with the check digit and decoded through NHTSA vPIC, behind the API's cache.
- **Log work in three steps**: what was done (from a catalog of 120 services in 14 categories, or a custom name), when and where, and what it cost.
- **Odometer scanning** with on-device text recognition, and an odometer rule: mileage can never go down over time.
- **Spending report** by category and year, and a history per vehicle.
- **Readable offline**: the server is the source of truth, and the app keeps a persisted copy so the garage opens without a connection. Changes need the API.

US market only: dollars and miles.

## How the code is organized

A Bun monorepo with three workspaces:

| Path | What it is |
|---|---|
| `packages/shared` | Framework-free TypeScript used by both the app and the API: Zod schemas, VIN validation, the service catalog, odometer consistency, spending math, money parsing. |
| `apps/api` | NestJS 12 API on Node 24, with Prisma 7 and PostgreSQL 18. |
| `apps/mobile` | Expo SDK 58 app (React Native 0.88, Expo Router, dev builds rather than Expo Go). |

Because both sides validate with the same schemas, a form error on the phone and a 422 from the API always say the same thing.

### `packages/shared`

Pure functions with no I/O, written test-first:

- `vin.ts`, `vin-scan.ts`: VIN normalization, the check digit, model-year candidates, and the frame-voting that turns noisy camera reads into one VIN.
- `odometer-consistency.ts`: given a vehicle's readings by date, the lowest and highest odometer a new reading may have (ADR-0007).
- `odometer-scan.ts`: picks the odometer out of the text on a dashboard, ignoring trip meters, clocks and temperatures.
- `catalog.ts`, `catalog-data.ts`: the service catalog. The API seeds it into Postgres from this same file.
- `spending.ts`, `money.ts`: integer-cent totals per category and year.

### `apps/api`

One NestJS module per resource: `vehicles`, `records`, `vin`, `transfer`, `devices`, `health`.

- **Identity.** A global guard reads `X-Device-Id`, stores only its HMAC, and creates the Owner on first use. Every query is scoped by Owner (ADR-0001).
- **Consistency.** Odometer checks run inside a transaction with the vehicle row locked, so two phones can't save conflicting readings at once.
- **VIN decoding.** Decodes go through a `VinDecoder` port, with a vPIC adapter behind it. Results are cached in Postgres: hits forever, misses for 24 hours, and outages never.
- **Abuse limits.** Rate limits apply per device, per VIN lookup, and per IP for new Owners. Request logs never contain the Device ID (ADR-0009).
- **Errors.** Every error has the shape `{ statusCode, message, code, details? }`.

### `apps/mobile`

```
src/
├── app/          Expo Router routes only (thin)
├── features/     one folder per screen or flow; features never import each other
├── shared/       what two or more features use: API client, store, sync, scanner bridge, form logic
└── components/   presentational building blocks
```

- **Local copy.** State lives in a Zustand store persisted to MMKV, and is refreshed from the API on launch and on foreground (ADR-0008).
- **Scanning.** Uses VisionCamera 5 with ML Kit text and barcode recognition, all on the device. `features/scanner/scanner-camera.tsx` is the only file that touches native camera code.
- **Native look.** UI copy lives in `shared/strings.ts`. Sheets and modals are native: form sheets, and a full-screen modal for the scanner.

### Decisions

Product decisions are written down as ADRs in `docs/adr/`, and the domain glossary is in `CONTEXT.md`. Planning material (the PRD, research notes and tickets) is in `.scratch/vehicle-maintenance-tracker/`.

## Running it

### Prerequisites

- [Bun](https://bun.sh) 1.4.4, used only as the package manager.
- Node 24 (see `.nvmrc`).
- Docker, for Postgres.
- Xcode 26 to build the iOS app (built with 26.5). Android Studio is needed only for Android.

```sh
bun install
```

### 1. Start Postgres and the API

The quickest way is the full stack in Docker: Postgres, then a one-off job that migrates and seeds the catalog, then the API.

```sh
docker compose up --build
curl localhost:3020/v1/health        # {"status":"ok","database":"up"}
```

For development you can run the API on the host with hot reload instead:

```sh
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
bun run build:shared
bun run --filter @vmt/api migrate:deploy
bun run --filter @vmt/api build && bun run --filter @vmt/api seed   # service catalog
bun run --filter @vmt/api start:dev                                  # http://localhost:3020
```

### 2. Run the app

The app uses native modules (camera, ML Kit, MMKV), so it needs a dev build rather than Expo Go.

```sh
cd apps/mobile
bun run ios          # builds the dev client, installs it on a simulator and starts Metro on port 8082
bun run android      # same for an Android emulator or device
```

In dev builds the app reaches the API on the machine that serves the bundle, port 3020. On an Android emulator, forward both ports first: `adb reverse tcp:3020 tcp:3020 && adb reverse tcp:8082 tcp:8082`.

The scanner needs a real camera; on a simulator it shows "No camera is available". ML Kit ships no arm64 simulator slice, so on Apple Silicon the simulator app is built for x86_64 and runs under Rosetta:

```sh
cd apps/mobile/ios
xcodebuild -workspace MaintenanceTracker.xcworkspace -scheme MaintenanceTracker \
  -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  ARCHS=x86_64 ONLY_ACTIVE_ARCH=NO -derivedDataPath build/dd-sim build
xcrun simctl install booted build/dd-sim/Build/Products/Debug-iphonesimulator/MaintenanceTracker.app
cd .. && bun run start
```

### 3. Install a release build on an iPhone (no Metro)

A Release build embeds the JavaScript bundle, so it runs without Metro. `EXPO_PUBLIC_API_URL` is inlined at build time: point it at your Mac's LAN IP, and keep the phone on the same Wi-Fi as the API.

```sh
cd apps/mobile
bunx expo prebuild --platform ios
cd ios
EXPO_PUBLIC_API_URL=http://$(ipconfig getifaddr en0):3020 xcodebuild \
  -workspace MaintenanceTracker.xcworkspace -scheme MaintenanceTracker \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath build/dd-release \
  DEVELOPMENT_TEAM=<your-team-id> CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates build

xcrun devicectl list devices                     # find the phone's identifier
xcrun devicectl device install app --device <identifier> \
  build/dd-release/Build/Products/Release-iphoneos/MaintenanceTracker.app
```

- **Local network permission.** On first launch the app asks for local-network access, which it needs to reach your Mac.
- **Team ID.** `<your-team-id>` is the `OU` of your Apple Development certificate, or the team shown in Xcode → Settings → Accounts.
- **Developer Mode.** The iPhone needs Developer Mode on (Settings → Privacy & Security).

## Tests

| What | Command | Count |
|---|---|---|
| Shared rules (Vitest) | `bun run --filter @vmt/shared test` | 132 |
| API unit (Vitest) | `bun run --filter @vmt/api test` | 21 |
| App components (jest-expo + Testing Library) | `bun run --filter @vmt/mobile test` | 91 |
| API integration against a real Postgres | see below | 54 |
| End-to-end on the iOS simulator (Maestro) | see below | 7 flows |

`bun run test` runs every unit suite. `bun run lint` runs oxlint (type-aware), and `bun run typecheck` runs TypeScript.

API integration tests use their own Postgres on port 5483:

```sh
bun run --filter @vmt/api db:test:up
bun run --filter @vmt/api test:int
bun run --filter @vmt/api db:test:down
```

### End-to-end (Maestro)

The flows in `apps/mobile/.maestro/` drive the dev build on an iOS simulator. Each one starts as a new phone, with an empty garage:

1. Add a vehicle without a VIN.
2. Log a service and see it in the history and the spending report.
3. Edit a record's total, then delete it.
4. Rename a vehicle, then delete it.
5. Add a vehicle by VIN (decoded through the API).
6. Validation messages on the vehicle form and in the log-work wizard.
7. Fill in every vehicle and record field, then check the record shows them.

```sh
# Every flow is a new Owner; the default limit is 10 new Owners per hour per IP.
(cd apps/api && THROTTLE_NEW_OWNERS_LIMIT=100000 bun run start:dev)
(cd apps/mobile && bun run start)
cd apps/mobile && maestro --device <simulator-udid> test .maestro
```

- Flow 5 has the `network` tag because the API calls vPIC unless the VIN is already cached. Skip it with `--exclude-tags network`.
- Number pads have no return key, so `subflows/dismiss-keyboard.yaml` closes the keyboard by dragging the form.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

- **Checks:** lint, typecheck, all unit tests, and a Metro bundle for iOS and Android. The bundle step catches Babel-plugin errors that Jest doesn't see.
- **Integration:** the API integration tests against a Postgres service container.

## Notes and trade-offs

- **Device ID.** The Device ID is a credential: the API stores only its HMAC, and the app never logs or shows it. Rotating `DEVICE_ID_HASH_SECRET` orphans every Owner (`docs/runbook.md`).
- **Bun isolated installs.** These work for the app with two adjustments. `jest.config.js` adds Bun's `.bun` store to jest-expo's `transformIgnorePatterns`, and the root `overrides` pin `react`/`react-dom` to the SDK's 19.3.0.
- **Out of v1** (PRD §2): accounts, recovery without the old phone, shared vehicles, reminders, fuel and insurance, receipt photos, an offline write queue, and markets other than the US.
