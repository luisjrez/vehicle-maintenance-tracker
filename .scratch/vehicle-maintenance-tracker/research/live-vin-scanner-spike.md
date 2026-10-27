# Live VIN scanner feasibility spike (Expo SDK 58)

Spike for [13 — Live VIN scanner feasibility spike](../issues/13-live-vin-scanner-spike.md), run on **2026-10-26**. Follows [ADR-0006](../../../docs/adr/0006-live-vin-scanning.md) (live scanning on both platforms) and builds on [vin-camera-scanning.md](vin-camera-scanning.md) (option E there).

This document **recommends**; the human decides.

## TL;DR

- **The library path works at build level.** An Expo SDK 58 dev-build app with **VisionCamera 5.2.3 + `react-native-vision-camera-mlkit` 2.0.1** (ML Kit text recognition + barcode scanning in **one** frame output, one camera session) **prebuilt and compiled on the first try, with no patches**:
  - iOS device (`iphoneos`, arm64, unsigned): **BUILD SUCCEEDED**
  - iOS Simulator **x86_64** (Rosetta): **BUILD SUCCEEDED**
  - iOS Simulator **arm64**: **fails**, because ML Kit pods set `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64` (a known ML Kit limitation, not something we can fix)
  - Android `assembleDebug` (arm64-v8a): **BUILD SUCCESSFUL**, bundled ML Kit models
  - Metro bundle for iOS and Android: OK. The `onFrame` worklet is transformed by `babel-preset-expo` with no `babel.config.js`.
- **Not verified:** runtime behavior (camera preview, frame processing, recognition accuracy). The simulator has no camera, and no physical device was used in this session. The human checklist below covers that.
- **Recommendation:** the spec should commit to **VisionCamera v5 + `react-native-vision-camera-mlkit`**, with one condition: the physical-device checklist must pass. Keep the custom Expo module (§6) as the documented fallback. Don't build it now.

## 1. Versions used

| Piece | Version | Notes |
|---|---|---|
| Expo SDK | `expo@~58.0.19` | `bunx create-expo-app@latest --template blank-typescript@sdk-58` |
| React Native / React | `0.88.0` / `19.3.0` | New Architecture (default, `newArchEnabled=true`) |
| `expo-dev-client` | `~58.0.15` | dev build |
| `react-native-vision-camera` | **5.2.3** (2026-08-20, npm `latest`) | Nitro-based v5; peers `react-native-nitro-modules`, `react-native-nitro-image` |
| `react-native-nitro-modules` | 0.37.1 | |
| `react-native-nitro-image` | 0.15.2 | |
| `react-native-worklets` | **0.13.0** (SDK 58 pin via `expo install`; npm latest 0.13.1) | peer `react-native: 0.86 - 0.88` |
| `react-native-vision-camera-worklets` | 5.2.3 | needed for `useFrameOutput` worklets |
| `react-native-vision-camera-mlkit` | **2.0.1** (2026-08-20) | text recognition + barcode scanning, frame and static image, has an Expo config plugin |
| ML Kit iOS | `GoogleMLKit` 9.0.0 → `MLKitTextRecognition` ~7.0, `MLKitBarcodeScanning` ~8.0 | fat frameworks (arm64 device + x86_64 sim) |
| ML Kit Android | `com.google.mlkit:text-recognition:16.0.1` (**bundled** Latin), `barcode-scanning:17.3.0` (bundled) | no Play Services download needed |
| Toolchain | Xcode 26.5, iOS deployment target 16.4, AGP 9.2.1, Gradle 9.4.1, Kotlin 2.2.0, compileSdk 37 / minSdk 24, JDK 17.0.17, Node 22.16.0, Bun 1.3.14 | No tool asked for a newer Node |

The library's built-in object scanner is no help on Android. VisionCamera core's `useObjectOutput` (AVMetadataOutput: `code-39`, `code-128`, `data-matrix`, `qr`, …) is **iOS-only** (`@platform iOS`). For cross-platform barcodes you need ML Kit, either through VisionCamera's own `react-native-vision-camera-barcode-scanner` 5.2.3 (ML Kit on both platforms) or through `react-native-vision-camera-mlkit`'s `useBarcodeScanning`. The spike uses the second option, so a **single** native ML Kit dependency set and a **single** frame output handle text, Code 39, Code 128, Data Matrix and QR. The first option was installed and then removed, to avoid two ML Kit barcode integrations.

## 2. What the spike app does

The app is at `/private/tmp/claude-501/-Users-luisjuarez-dev-mobile-automobile-service-tracker/009d0d92-75d4-45dc-a2f9-cfc35f75586a/scratchpad/vin-scanner-spike` (throwaway, outside the repo; `/private/tmp` can be wiped on reboot).

- `App.tsx` has one screen. It asks for camera permission (`useCameraPermission`), shows the back camera (`<Camera device outputs={[frameOutput]} isActive />`) and runs one `useFrameOutput` worklet (HD 16:9, `yuv`). On every frame the worklet does two things:
  - It calls `barcodeScanning(frame)` with formats `CODE_39, CODE_128, DATA_MATRIX, QR_CODE` and logs `[barcode] <FORMAT>: <rawValue>`.
  - It calls `textRecognition(frame)` (Latin), compacts the text and logs `[text] VIN-like: <17 chars>` when a `[A-HJ-NPR-Z0-9]{17}` run appears.
  - There is no check-digit validation, voting, ROI or UI polish. All of that belongs to the real implementation and `packages/shared`.
- `app.json` sets three things:
  - `ios.infoPlist.NSCameraUsageDescription` and `android.permissions: ["android.permission.CAMERA"]`. VisionCamera v5 ships **no** config plugin, so permissions are declared by hand.
  - Bundle id / package `dev.spike.vinscanner`.
  - The `react-native-vision-camera-mlkit` plugin with `textRecognition: true, barcodeScanning: true` and **all CJK/Devanagari keys set to `false`**.

## 3. Build results (only builds actually run in this session)

| # | Command | Result |
|---|---|---|
| 1 | `bunx expo prebuild --clean` (both platforms, incl. `pod install`, 129 pods) | OK |
| 2 | `xcodebuild -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build` | **BUILD SUCCEEDED** (first run with default ML Kit languages; re-run after the Latin-only fix: **SUCCEEDED**, the app bundle then contains only `LatinOCRResources.bundle`) |
| 3 | `./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a` | **BUILD SUCCESSFUL** (3m49s; re-run after the Latin-only re-prebuild: 1m20s, `app-debug.apk` 94 MB debug) |
| 4 | `xcodebuild -sdk iphonesimulator ARCHS=arm64` | **BUILD FAILED**. `Pods-vinscannerspike-frameworks.sh: line 132: ARCHS[@]: unbound variable`, preceded by `warning: None of the architectures in ARCHS (arm64) are valid … EXCLUDED_ARCHS (arm64)`. Cause: `MLKitVision`/`MLKitBarcodeScanning`/… xcconfigs set `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64`, and that propagates to the app target. `lipo` confirms the ML Kit frameworks are fat `x86_64 arm64` (device arm64), not xcframeworks with an arm64-simulator slice. |
| 5 | `xcodebuild -sdk iphonesimulator ARCHS=x86_64 ONLY_ACTIVE_ARCH=NO` (workaround for #4) | **BUILD SUCCEEDED** |
| 6 | `bunx expo export --platform ios --platform android` (+ `--no-bytecode --no-minify`) | OK. `onFrame` gets `__workletHash`/`__closure`, so the worklet transform is applied automatically. |

Things I expected to break but that did not:
- **Xcode 26.4+ `fmt`/`consteval` Pods error** (documented in the mlkit README with a Podfile patch): it did not occur on Xcode 26.5 / RN 0.88, and no patch was needed.
- **AGP 9 built-in Kotlin collision** (VisionCamera PR #4181, *"Cannot add extension with name 'kotlin'"*): it did not occur, because the SDK 58 template sets `android.builtInKotlin=false` in `gradle.properties`. Keep that flag. Revisit when VisionCamera merges #4181 or when AGP 10 removes the flag.
- **`@expo/config-plugins ^57.0.0` peer** of the mlkit plugin vs the installed 58.0.10: no install error, and the plugin ran correctly in prebuild (Podfile `$VisionCameraMLKit` hash and `ext["react-native-vision-camera-mlkit"]` written).
- Android warnings only: unused-parameter warnings in VisionCamera C++ and the deprecated CameraX `getExtensionEnabledCameraSelector`. They are harmless.

Gotcha found: the plugin's **defaults enable all five OCR scripts**. Setting only `textRecognition: true` still installed `MLKitTextRecognitionChinese/Japanese/Korean/Devanagari` (the first device build shipped all their resource bundles). The real app must set the four non-Latin keys to `false` explicitly.

## 4. Library maintenance health (2026-10-26)

| Package | Signal |
|---|---|
| VisionCamera (`margelo/react-native-vision-camera`; moved from `mrousavy` org in Aug 2026) | 9.65k★, 126 open issues/PRs. Last release **5.2.3 on 2026-08-20**, so **no release targets RN 0.88**. The last merged commit on `main` was 2026-10-14. Many community fix PRs from Sept–Oct are open and unmerged, so merging is slow. Open issues to watch: #4219 (iOS **release**: any JS exception inside a frame callback kills the process, because of a `noexcept` Nitro wrapper), #4209 (iOS SIGABRT in `detachFromFigCaptureSession` when Hermes GC frees a `CameraSession`, still on 5.2.3), #4211 (iOS 17.7/18.6 camera screen crash on v5), #4213 (Android: each `FrameOutput` leaks its native thread), #4232 (Android black preview after another session is cleared). |
| `react-native-vision-camera-mlkit` (`pedrol2b`) | 58★, 1 open issue (feature request), 2.0.1 on 2026-08-20, last push 2026-08-20. **Single maintainer**, small user base. Code is clean (Nitro, selective deps, ROI support, Expo plugin). |
| `react-native-vision-camera-ocr-plus` 2.0.6 | Alternative, text only (barcodes would need a second plugin). Open #154: async OCR failures silently swallowed. |
| `vision-camera-ocr-plugin` 5.0.12 | Released today, 4★, text only, ML Kit on both platforms. Too young. |
| Apple Vision–based live plugin for VisionCamera v5 | **None found.** Every maintained live-OCR plugin uses **ML Kit on iOS too** (bigger binary, no arm64 simulator). |
| Expo-friendly live OCR (no VisionCamera) | None mature. `expo-ocr-kit` 0.1.4 and `expo-mlkit-ocr` 0.2.7 only do OCR on still images. `expo-camera` 58 has barcodes but no text. |

## 5. Recommendation

**Commit the spec to VisionCamera v5 + `react-native-vision-camera-mlkit` (ML Kit text + barcode in one frame output), replacing `expo-camera` for all camera uses (VIN text, door-jamb barcode, QR transfer), as ADR-0006 anticipated.** One condition: the physical-device checklist (§7) passes on one iPhone and one Android phone.

Why:
- It compiles on SDK 58 / RN 0.88 / New Arch on both platforms without patches. The only constraint is the iOS simulator (x86_64/Rosetta only, which is irrelevant since the simulator has no camera anyway).
- One session and one worklet give QR, Code 39, Code 128, Data Matrix and VIN text, which is exactly the ADR-0006 shape. The plugin also offers `roi`, which maps to the scanner's guide box.
- Android ML Kit is bundled (offline on first use), matching ADR-0006.
- The custom module (§6) costs about 1.5–2 weeks of native work. Spend that only if the device test fails.

Mitigations to put in the spec:
- **Pin exact versions** (`react-native-vision-camera@5.2.3`, `-worklets@5.2.3`, `react-native-vision-camera-mlkit@2.0.1`, Nitro modules/image as tested). Keep `react-native-worklets` at the SDK pin.
- Set the plugin's CJK/Devanagari flags to `false`. Keep `android.builtInKotlin=false`.
- Wrap all frame-callback code in `try/finally` and **never throw out of a worklet** (#4219 kills the process on iOS release). Mount the camera only while the scanner screen is focused, and keep a single `<Camera>` instance (#4209, #4232).
- Throttle text recognition to every Nth frame, or alternate barcode and text frames, if FPS/thermals are poor (to be checked on device).
- Keep the VIN logic (normalize, confusable correction, check digit, multi-frame voting) in `packages/shared` behind a small `ScannerResult` port, so the native engine can be swapped for §6 without touching the app logic.
- Dev workflow: physical devices, or iOS Simulator under Rosetta / an x86_64 destination for UI work. Jest needs a JS mock of the camera and mlkit modules.

## 6. Fallback: custom Expo module (outline only, not built)

Use this if the device test shows blocking crashes, unacceptable accuracy, or the libraries stall on a future SDK.

- **Shape:** local Expo module `apps/mobile/modules/vin-scanner` (Expo Modules API, stable 1.x DSL, autolinked, no config plugin needed beyond the camera permission strings). One native **view** `VinScannerView` with props `active`, `torch`, `roi`, `barcodeTypes`, and events `onBarcode({format, value, bounds})` and `onText({lines: [{candidates: [{text, confidence}], box}]})`. Throttling (max N events/s) happens in native code, and the same `packages/shared` logic runs in JS.
- **iOS:** an `AVCaptureSession` with a preview layer and two outputs:
  - `AVCaptureMetadataOutput` for `.code39, .code39Mod43, .code128, .dataMatrix, .qr`, with `rectOfInterest` set to the guide box.
  - `AVCaptureVideoDataOutput` feeding a `VNRecognizeTextRequest` (`.accurate`, `usesLanguageCorrection = false`, `regionOfInterest`, `topCandidates(3)`) on a serial queue, dropping late frames.
  - Zero extra binary size, and it works on the arm64 simulator (no camera there, but it builds).
  - Alternative: VisionKit `DataScannerViewController` (text + barcodes, polished UI, iOS 16+/A12+) as the iOS view.
- **Android:** CameraX (`Preview` + `ImageAnalysis`, `STRATEGY_KEEP_ONLY_LATEST`) with ML Kit `text-recognition:16.0.1` (bundled Latin) and `barcode-scanning:17.3.0`, both fed from one analyzer. That's the same models as the library path. Lifecycle is bound to the view.
- **Effort estimate:** iOS 3–4 days, Android 3–4 days, JS view and types plus mock 1 day, device testing and polish 2–3 days. That makes **about 9–12 working days**, plus ongoing ownership across SDK upgrades (orientation, interruptions, permissions, torch, zoom and focus are all on us).

## 7. Human checklist: run the spike on a physical device

Prereqs: the spike folder above (copy it somewhere permanent first if needed, since `/private/tmp` can be cleared), a phone on USB, and the laptop and phone on the same Wi-Fi (Metro).

**iOS (iPhone, iOS 16.4+):**
1. `cd <spike> && open ios/vinscannerspike.xcworkspace`. Under target *vinscannerspike → Signing & Capabilities*, pick your personal team. If the bundle id is taken, change it.
2. `bunx expo run:ios --device` (choose your iPhone). Or start `bunx expo start` and press Run in Xcode. On the phone, trust the developer profile (Settings → General → VPN & Device Management) and enable Developer Mode if prompted.
3. Allow camera access.

**Android (phone with USB debugging on):**
1. `cd <spike> && bunx expo run:android --device`. Or install the APK that was already built with `adb install android/app/build/outputs/apk/debug/app-debug.apk` (arm64-v8a only), then run `bunx expo start` and open the dev client.
2. Allow camera access.

**What to point at and what to look for.** Logs appear in the Metro terminal. If nothing shows there, check the Xcode console or `adb logcat | grep -i ReactNativeJS`.
- [ ] Preview shows and is smooth (no freeze, no black screen) for 60 s. Background the app and come back: the preview resumes.
- [ ] **QR:** any QR code (e.g. a URL on a laptop screen) logs `[barcode] QR_CODE: …` within about 1 s.
- [ ] **Door-jamb sticker:** the driver-side B-pillar label logs `[barcode] CODE_39: …` (or `CODE_128` / `DATA_MATRIX`) with the 17-char VIN, possibly with an extra leading `I`. Note how close you had to hold the phone.
- [ ] **Windshield plate** (from outside, driver side, daylight and shade, phone torch off): see whether `[text] VIN-like: …` appears and **compare it character by character with the real VIN**. Note the failure rate and which characters get confused (0/O/D/Q, 1/I/L, 5/S, 8/B, 2/Z).
- [ ] The same plate on a printed or on-screen VIN (an easy target) reads correctly, which separates OCR quality from glare and angle problems.
- [ ] No crash after 2–3 minutes of continuous scanning. The phone doesn't get noticeably hot, and the battery drain feels acceptable.
- [ ] Repeat everything on both platforms and write down device models and OS versions.

Pass bar for committing to the library: all of the above work with no crash on both phones, and the door-jamb barcode reads reliably. Windshield OCR accuracy is a product risk (glare, tint), not a library-choice blocker, unless it is far worse than the printed-VIN control.

## Sources

- npm registry (`npm view <pkg> version dist-tags peerDependencies time`), 2026-10-26: `react-native-vision-camera`, `react-native-vision-camera-worklets`, `react-native-vision-camera-barcode-scanner`, `react-native-nitro-modules`, `react-native-nitro-image`, `react-native-worklets`, `react-native-vision-camera-mlkit`, `react-native-vision-camera-ocr-plus`, `vision-camera-ocr-plugin`, `expo-ocr-kit`, `expo-mlkit-ocr`
- GitHub API, 2026-10-26: `margelo/react-native-vision-camera` (commits, releases, issues #4181, #4209, #4211, #4213, #4219, #4232), `pedrol2b/react-native-vision-camera-mlkit`, `jamenamcinteer/react-native-vision-camera-ocr-plus`
- Package sources and READMEs in `node_modules` (VisionCamera `ScannedObject.nitro.ts` / `CameraObjectOutput.nitro.ts` `@platform iOS`; mlkit README: ML Kit has no arm64-simulator slice, and the Xcode 26.4 fmt workaround)
- Build logs in the spike folder: `ios-device-build.log`, `ios-device-build-2.log`, `ios-sim-arm64-build.log`, `ios-sim-x86_64-build.log`, `android-build.log`, `android-build-2.log`
