# VIN camera scanning (on-device OCR) on Expo SDK 58

Research for [11 — VIN camera scanning approach](../issues/11-vin-camera-scanning-approach.md). Researched **2026-10-26**. Context: VIN is optional, strictly validated by a shared validator in `packages/shared`, and may be typed/pasted or scanned with native OCR ([08](../issues/08-vin-policy-decisions.md), [ADR-0003](../../../docs/adr/0003-vin-policy.md)). Stack: Expo SDK 58 (stable since 2026-10-15), RN 0.88, React 19.3, New Architecture, Bun workspaces; Expo Go for SDK 58 is not in the stores yet, so the app runs as a **dev build** anyway ([stack research](stack-and-repo-shape.md)). v1 already needs a camera for the **QR device-transfer** flow ([01](../issues/01-data-ownership-without-auth.md)).

This document **recommends**; the human decides.

## TL;DR

- **No Expo first-party package does OCR.** `expo-camera` does barcodes (incl. `code39`, `code128`, `datamatrix`, `qr`), photos and (new in SDK 58) document scanning — but no text recognition.
- **Recommended:** keep **one camera stack = `expo-camera`** (QR transfer + door-jamb barcode + VIN photo) and add a **small local Expo module** (`apps/mobile/modules/vin-ocr`) that runs OCR on a captured photo: **Apple Vision `VNRecognizeTextRequest`** on iOS and **ML Kit Text Recognition v2** on Android, tuned for VINs (language correction off, several candidates per line, region of interest). All VIN logic — candidate extraction, confusable-character correction, check digit, multi-shot voting — lives in **`packages/shared`**, next to the validator, and is unit-testable in plain TS.
- `expo-text-extractor` (MIT) proves the module is tiny (~40 lines of Swift), but its defaults are wrong for VINs (language correction on, top-1 candidate, no boxes) — use it as a reference, not a dependency.
- **Live, frame-by-frame scanning** (VisionCamera v5 + an ML Kit frame-processor plugin) is the upgrade path if the photo-based UX proves too clunky. It is not recommended for v1: it adds Nitro + worklets, replaces `expo-camera` everywhere, puts ML Kit on iOS (no arm64-simulator slice), and VisionCamera's last release (5.2.3, 2026-08-20) predates RN 0.88.
- **The check digit is what makes OCR usable**: it detects every single-character substitution between characters with different transliteration values, so the scanner can try confusable substitutions (I/1, O/0, Q/0, S/5, B/8, Z/2, G/6, D/0) and keep only candidates that pass. The result is **always shown to the user for confirmation**, never saved silently.

## 1. Candidates

### 1.1 What Expo ships (SDK 58)

| Package / API | What it gives | Text recognition? |
|---|---|---|
| `expo-camera@58.0.12` `CameraView` | Preview, `takePictureAsync` (`shutterSound: false` available), `onBarcodeScanned` with `barcodeTypes` `aztec, ean13, ean8, qr, pdf417, upc_e, datamatrix, code39, code93, itf14, codabar, code128, upc_a` ([docs](https://docs.expo.dev/versions/latest/sdk/camera/)). iOS: no `cornerPoints` for `code39`/`pdf417`. | **No** |
| `CameraView.launchScanner()` | Modal system scanner: Google code scanner on Android, **VisionKit `DataScannerViewController`** on iOS 16+ — but configured for **barcodes only** (`barcodeTypes`). | **No** (Expo does not expose DataScanner's text mode) |
| `CameraView.scanDocumentAsync` (new in SDK 58, [changelog](https://expo.dev/changelog/sdk-58)) | Multi-page document scanner returning images | No — and it is built for paper documents, not a small plate behind a windshield |
| `Camera.scanFromURLAsync` | Barcodes from an image file | No; **iOS: QR only** |
| `@expo/ui` | SwiftUI / Jetpack Compose UI components | No camera/OCR |

Conclusion: OCR needs a third-party or custom native module. Native modules are fine because the app is a dev build regardless.

### 1.2 Third-party and custom options

| # | Approach | Engines (iOS / Android) | UX | SDK 58 / New Arch | Health (2026-10-26) | License | Native weight | Config plugin |
|---|---|---|---|---|---|---|---|---|
| **A** | **`expo-camera` photo → local Expo module `vin-ocr`** (custom, in repo) | Apple Vision / ML Kit TR v2 | Capture (1–3 shots), not live | Expo Modules API — first-class on SDK 58 / New Arch; no third-party native deps except ML Kit on Android | We own it (~150–250 lines Swift+Kotlin) | Ours; ML Kit is free, Google ML Kit terms | iOS: **0** (Vision is a system framework). Android: bundled Latin model ≈ **4 MB per ABI**, or unbundled ≈ 260 KB + Play Services download ([ML Kit Android](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)) | Not needed (autolinked local module; Gradle dep declared in the module) |
| B | `expo-camera` photo → [`expo-text-extractor`](https://github.com/pchalupa/expo-text-extractor) 2.0.0 | Apple Vision / ML Kit (unbundled, `play-services-mlkit-text-recognition:19.0.1`) | Capture | Expo module, peer `expo: *`, SDK 52+ in README; no SDK 58 statement | 72★, last release 2026-02-28, last commit 2026-05-04 (dependabot); open bug: `file://` URIs fail on Android 10+ (#17) | MIT (npm) | Same as A (unbundled) | No |
| C | `expo-camera` photo → [`@react-native-ml-kit/text-recognition`](https://github.com/a7med-mahmoud/react-native-ml-kit) 2.0.0 | ML Kit / ML Kit | Capture | Legacy bridge module (runs via interop); untested on 0.88 | 588★, last release 2025-09-01, last push 2025-09-06, 26 open issues | MIT | iOS ML Kit pods (several MB) + Android model | No |
| D | `expo-camera` photo → [`@infinitered/react-native-mlkit-text-recognition`](https://github.com/infinitered/react-native-mlkit) 5.0.1 | ML Kit / ML Kit | Capture | Expo module | 449★, single release 2025-11-25, last push 2026-08-05 | MIT | iOS ML Kit pods + Android model | No |
| E | **VisionCamera v5** + [`react-native-vision-camera-mlkit`](https://github.com/pedrol2b/react-native-vision-camera-mlkit) 2.0.1 | ML Kit / ML Kit | **Live** (frame processor via `useFrameOutput` worklet) + static image API | Requires RN ≥ 0.86, Nitro modules, `react-native-worklets` (0.13.1 peers RN 0.86–0.88), `react-native-vision-camera-worklets`. Peer `@expo/config-plugins ^57.0.0` (SDK 58 ships 58.0.x → peer warning). No SDK 58 statement | VisionCamera: 9.6k★, 5.2.3 on 2026-08-20; plugin: 58★, 2.0.1 on 2026-08-20 | MIT | VisionCamera + Nitro + worklets + ML Kit on both platforms | Yes (selects ML Kit models per feature/language) |
| F | VisionCamera v5 + [`react-native-vision-camera-ocr-plus`](https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus) 2.0.6 | ML Kit / ML Kit | Live + `PhotoRecognizer` | Peers VisionCamera ≥ 5, RN ≥ 0.81, worklets ≥ 0.8; README lists Expo 54 | 73★, 2.0.6 on 2026-08-20, open #154 "async OCR failures silently swallowed" | MIT | Same as E | Not mentioned |
| G | Custom module with **live** view (AVCaptureVideoDataOutput + Vision on iOS, CameraX + ML Kit on Android) or VisionKit `DataScannerViewController` text mode on iOS | Vision / ML Kit | Live | Expo Modules API | Ours, much larger (native camera view ×2) | Ours | As A | No |
| — | Dead / incompatible: `react-native-vision-camera-text-recognition` 3.1.1 (2024-08), `react-native-vision-camera-v3-text-recognition` (2024-05), `vision-camera-ocr` (2022), `@bear-block/vision-camera-ocr` 4.0.3 (VisionCamera ^3/^4 + worklets-core only), `expo-mlkit-ocr` 0.2.7 (one-week-old hobby package, May 2026) | | | | | | | |

Sources for versions/dates: `npm view <pkg> version time license peerDependencies` and `gh api repos/<owner>/<repo>` on 2026-10-26; [VisionCamera releases](https://github.com/mrousavy/react-native-vision-camera/releases); [VisionCamera docs](https://visioncamera.margelo.com/docs). No VisionCamera issue specifically reporting RN 0.88 / SDK 58 breakage was found, but none confirming support either — treat it as **unverified**.

### 1.3 iOS VisionKit `DataScannerViewController` (Live Text scanner)

Apple's [DataScannerViewController](https://developer.apple.com/documentation/visionkit/datascannerviewcontroller) (iOS 16+, A12 Bionic or newer, check `isSupported` / `isAvailable`) gives a polished live scanner: `recognizedDataTypes` `.text(languages:textContentType:)` and `.barcode(symbologies:)`, `regionOfInterest`, `qualityLevel` (`.fast/.balanced/.accurate`), `isHighlightingEnabled`, guidance ("Slow down"), pinch-to-zoom, delegate callbacks as items are added/updated, and `capturePhoto()`.

Evaluation for VINs:
- **Good:** best-in-class live UX on iOS, both text and barcodes in one view, zero model size, on-device.
- **No VIN content type** (types are things like URL, email, phone, address, tracking number, flight number) and no custom pattern; we would receive every text item and filter with our own regex/check-digit — fine, but highlights would cover all text, not just the VIN, unless we draw our own overlay.
- **iOS only.** Android has no equivalent system text scanner (Google's code scanner is barcode-only), so Android would still need ML Kit + our own UI → two different UXs to build and test.
- **Not exposed by Expo** for text (Expo's `launchScanner` uses it for barcodes only), so it would be custom native code anyway.

Verdict: attractive as a later **iOS-only enhancement** inside the same local module (`scanVinLive()` on iOS, falling back to the photo flow on Android), not as the v1 baseline. (Apple's API pages are JS-rendered and could not be fetched in this session; details above are from Apple's API reference as commonly documented — re-check when implementing.)

### 1.4 Why the custom module (A) over expo-text-extractor (B)

`expo-text-extractor`'s whole iOS implementation is one `VNRecognizeTextRequest` with default settings returning `topCandidates(1)` strings ([source](https://github.com/pchalupa/expo-text-extractor/blob/main/ios/ExpoTextExtractorModule.swift)). For VINs we want, and B does not offer:

- `usesLanguageCorrection = false` — the language model "corrects" non-dictionary strings like VINs toward words (Apple: [VNRecognizeTextRequest](https://developer.apple.com/documentation/vision/vnrecognizetextrequest)); `recognitionLevel = .accurate`; `recognitionLanguages = ["en-US"]`.
- **Several candidates per line** (`topCandidates(3)` on iOS; ML Kit exposes per-element/symbol text and confidence) to feed the correction step.
- **Region of interest** = the on-screen guide box, so the plate text, not the dashboard or sticker clutter, is read; and `minimumTextHeight` tuned to the box.
- Bounding boxes (to pick the line inside the guide) and proper EXIF orientation handling.
- Android: choose bundled vs unbundled ML Kit model deliberately (B uses unbundled, which needs Google Play services and a first-use download — fails on devices without GMS), and accept `file://` URIs from `expo-camera` (B has an open bug there).

Writing it as a **local Expo module** (`npx create-expo-module --local`) keeps it in the repo, autolinked, New-Arch native, and versioned with the app. Rough surface:

```ts
// apps/mobile/modules/vin-ocr — sketch, not code to commit
recognizeText(uri: string, opts: { roi?: Rect; minTextHeight?: number }): Promise<OcrLine[]>
type OcrLine = { candidates: { text: string; confidence: number }[]; box: Rect };
```

## 2. VIN-specific accuracy

### 2.1 Where VINs are and what goes wrong

- **Windshield plate** (driver side, base of the windshield, read from outside): small stamped/printed characters behind tinted, curved, often dirty glass. Problems: **glare/reflections** (sun, the phone's torch — keep torch off by default), steep angle, focus on the glass instead of the plate, dashboard texture, small character height. No barcode there (per vendor sources, e.g. [CarCheckerVIN](https://www.carcheckervin.com/vin-barcode-scanner)).
- **Door-jamb certification label** (driver door B-pillar): flat sticker, usually also a **VIN barcode** — easier target. See §3.
- ML Kit guidance: characters should be ≥ **16×16 px** (no gain above 24×24), poor focus hurts, smaller frames for real-time ([ML Kit Android guide](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)). A full-resolution **photo** gives far more pixels per character than a live preview frame — a point in favor of the capture flow for tiny windshield plates.

### 2.2 Character confusions and how the rules prune them

VIN alphabet is `[A-HJ-NPR-Z0-9]` (no I, O, Q) — see [vin-validation-and-decoding.md](vin-validation-and-decoding.md). Typical OCR confusions on the plate font: **I↔1, O↔0, Q↔0, D↔0, S↔5, B↔8, Z↔2, G↔6, T↔7, A↔4, L↔1**.

Deterministic, safe fixes (applied to OCR output only, never to typed input):
1. **Normalize**: uppercase, drop spaces/dashes/`*`, strip a leading/trailing non-VIN char (some VIN barcodes/labels carry a leading `I` — commonly reported, not verified here).
2. **Illegal letters are never ambiguous**: `I→1`, `O→0`, `Q→0` always.
3. **Position rules** (49 CFR 565.15): positions **13–17 must be digits** for cars/MPVs/light trucks → map `S→5, B→8, Z→2, G→6, D→0, T→7, A→4, L→1` there. Position 10 (model year) can never be `U, Z, 0`. Position 9 is `0–9` or `X`.

Then the **check-digit search**:
4. For each remaining position whose character belongs to a confusable pair, generate the alternatives (bounded: e.g. at most 4 ambiguous positions → ≤ 16 variants; or use the OCR's 2nd/3rd candidates per character).
5. Keep only variants that pass the full shared validator (format, year code, check digit).
6. Exactly one survivor → propose it. Several survivors → show them and let the user pick / edit. None → show the raw read in the editable field with an error.

Why this works: with mod-11 weights 1–10 and transliteration values 0–9, **any single substitution between two characters with different values is detected** (11 is prime, so `Δvalue × weight ≢ 0 mod 11`). The listed confusions all differ in value (e.g. S=2 vs 5, B=2 vs 8, Z=9 vs 2, G=7 vs 6, D=4 vs 0). Blind spots: substitutions between same-value characters (e.g. `A`/`J`/`1` all = 1, `B`/`K`/`S`/`2` all = 2) are invisible to the check digit; errors at position 9 just change the expected digit; and every extra variant tried has a ≈1/11 chance of passing by luck. Hence the rule: **OCR proposes, the user confirms** — the scanned VIN lands in the same editable VIN field as typed input, and the decode preview (make/model/year from our API) is the second sanity check.

### 2.3 Multi-shot voting

Take 2–3 photos in quick succession (or let the user retake), extract the best 17-char window from each, align by position and **vote per character** (weighted by OCR confidence) before the check-digit search. With a live pipeline (option E/G) the same voting runs over N frames and stops when the same validated VIN is seen in, say, 3 of the last 5 frames. The voting and correction code is pure TS in `packages/shared` and can be unit-tested with fixture strings (no device needed).

## 3. Door-jamb barcode — nearly free

- `expo-camera` already decodes `code39`, `code128`, `datamatrix`, `qr` ([docs](https://docs.expo.dev/versions/latest/sdk/camera/)). VIN barcodes on door-jamb labels are mostly **Code 39** (USS Code 39 variant), with **Code 128, Data Matrix and QR** on some newer vehicles ([Dynamsoft](https://www.dynamsoft.com/blog/imaging/barcode/scanning-vin-codes-barcode-reader/), [barKoder](https://barkoder.com/blog/vehicle-identification-number-vin-via-barcoding) — vendor sources).
- So the same `CameraView` used for the VIN photo can run `onBarcodeScanned` with `["code39","code128","datamatrix","qr"]` simultaneously: if a barcode yields a string that normalizes to a valid VIN, it short-circuits OCR. Barcode output still goes through the shared validator.
- Caveats: Android barcode scanning requires `barcodeScannerEnabled` (default `true`); iOS returns no corner points for Code 39 (only matters for overlays); a VIN barcode may carry an extra leading character (see §2.2).
- With VisionCamera (E/F) the equivalent is `react-native-vision-camera-barcode-scanner` (ML Kit) or the built-in object output — also available, but another package.

## 4. Interaction with the QR transfer flow

The device-transfer flow ([01](../issues/01-data-ownership-without-auth.md)) needs a QR scanner on the new phone. With the recommended approach **one camera stack (`expo-camera`) serves all three uses**: QR transfer code, door-jamb VIN barcode, VIN photo for OCR — one permission string, one config plugin, one set of camera bugs. A shared "scanner screen" component can take the barcode types and an optional "capture for OCR" action.

For QR alone, `CameraView.launchScanner({ barcodeTypes: ["qr"] })` is even simpler (system UI; on Android the Google code scanner needs no camera permission) — a choice for the flows ticket.

Choosing VisionCamera for OCR (E/F) would mean either running two camera libraries (two permission flows, two native camera stacks, conflicts if both mount) or moving QR scanning to VisionCamera too.

## 5. Recommendation

**A — `expo-camera` + local `vin-ocr` Expo module (Apple Vision on iOS, ML Kit Text Recognition v2 on Android), VIN logic in `packages/shared`.**

Flow sketch (for the flows/screens ticket, not decided here): VIN field → "Scan" → camera screen with a guide box and hint ("windshield plate or door-jamb sticker") → live barcode detection for the door-jamb barcode; shutter (or auto-burst of 2–3) for OCR → result goes into the editable VIN field with the decode preview → user confirms. Any failure → "Type it instead" / "Add without VIN" (already decided).

Why:
- No new camera stack; `expo-camera` is first-party, versioned with SDK 58, and already needed for QR.
- iOS OCR adds **zero** binary size and avoids ML Kit's iOS pods (which lack an arm64 simulator slice — Apple Silicon simulator builds can fail, per the [vision-camera-mlkit README](https://github.com/pedrol2b/react-native-vision-camera-mlkit)).
- Full control over VIN-specific settings; no dependency on hobby-maintained OCR wrappers whose SDK 58 status is unknown.
- Full-res photos help with tiny windshield characters; on-device and offline, no image ever leaves the phone (fits the no-auth privacy posture).
- Cost: ~a day of native work plus device testing on both platforms; the module surface is one async function.

Upgrade path if user testing shows the capture flow is too clunky: (1) add an iOS-only live path via `DataScannerViewController` in the same module; or (2) switch the whole scanner to VisionCamera v5 + `react-native-vision-camera-mlkit` once those publish a release verified on RN 0.88 / SDK 58. The `packages/shared` correction/voting code carries over unchanged.

Fallback if the team does not want to own native code: **B (`expo-text-extractor`)** — accept top-1/language-corrected output, rely harder on the check-digit search, and verify the Android `file://` bug.

## 6. Risks

- **Windshield plate accuracy is the unknown.** Glare, tint and tiny characters may make OCR fail often on some cars; mitigations: guide box, tap-to-focus, zoom, torch off by default, "try the door-jamb sticker" hint, easy fallback to typing. Needs real-car testing on both platforms before committing UX copy.
- **False positives** from the check-digit search (same-value substitutions, 1/11 luck) → mitigated by mandatory user confirmation and the decode preview.
- **Android ML Kit model choice**: bundled adds ~4 MB per ABI (Play splits per ABI); unbundled needs Google Play services and a first-use download (devices without GMS, or offline first use, would fail).
- **Owning native code**: two small native files to maintain across SDK upgrades (Expo Modules API is stable; Expo Modules 2.0 is beta in SDK 58 — stay on the stable API).
- **Testing**: OCR can't run in jest; native module needs a JS mock; camera does not exist on the iOS simulator → physical-device testing for the scanner (E2E tooling is out of scope).
- **VisionCamera path risk** (if chosen later): last release predates RN 0.88; plugin peers pin `@expo/config-plugins ^57`; Nitro/worklets version coupling.

## 7. Open questions for the human

1. Is a **capture-photo** scanning UX acceptable for v1, or is **live** scanning (point and it locks on) a requirement? This is the main fork between A and E.
2. OK to **own a small native module** (Swift + Kotlin) in the repo, vs. a third-party wrapper?
3. Android ML Kit: **bundled** (+~4 MB, works offline immediately) or **unbundled** (tiny, needs Play services + download)?
4. Include **door-jamb barcode** detection in v1 (near-free with `expo-camera`), and should the scanner screen hint the user toward the door-jamb sticker first (easier than the windshield)?
5. QR transfer: same custom scanner screen, or the system `launchScanner` modal?
6. Is an **iOS-only live enhancement** (DataScannerViewController) acceptable later, accepting different UX per platform?

## Sources

- Expo Camera API (SDK latest = 58): <https://docs.expo.dev/versions/latest/sdk/camera/>
- Expo SDK 58 changelog: <https://expo.dev/changelog/sdk-58>
- VisionCamera releases / docs: <https://github.com/mrousavy/react-native-vision-camera/releases>, <https://visioncamera.margelo.com/docs>
- react-native-vision-camera-mlkit: <https://github.com/pedrol2b/react-native-vision-camera-mlkit>
- react-native-vision-camera-ocr-plus: <https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus>
- expo-text-extractor: <https://github.com/pchalupa/expo-text-extractor> (iOS source: `ios/ExpoTextExtractorModule.swift`; Android: `play-services-mlkit-text-recognition:19.0.1`)
- @react-native-ml-kit/text-recognition: <https://github.com/a7med-mahmoud/react-native-ml-kit>
- @infinitered/react-native-mlkit: <https://github.com/infinitered/react-native-mlkit>
- ML Kit Text Recognition v2: <https://developers.google.com/ml-kit/vision/text-recognition/v2>, Android guide <https://developers.google.com/ml-kit/vision/text-recognition/v2/android>
- Apple VisionKit DataScannerViewController: <https://developer.apple.com/documentation/visionkit/datascannerviewcontroller>
- Apple Vision VNRecognizeTextRequest: <https://developer.apple.com/documentation/vision/vnrecognizetextrequest>
- VIN rules / check digit: [vin-validation-and-decoding.md](vin-validation-and-decoding.md) (49 CFR 565)
- VIN barcodes (vendor sources): <https://www.dynamsoft.com/blog/imaging/barcode/scanning-vin-codes-barcode-reader/>, <https://barkoder.com/blog/vehicle-identification-number-vin-via-barcoding>, <https://www.carcheckervin.com/vin-barcode-scanner>
- npm metadata (`npm view`) and GitHub API (`gh api repos/…`) queried 2026-10-26.
