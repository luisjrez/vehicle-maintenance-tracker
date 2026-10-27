# VIN camera scanning approach

Type: research
Status: resolved
Blocked by:

## Question

How do we scan a VIN with the camera on Expo SDK 58 using native OCR (iOS Vision / Android ML Kit text recognition)? Compare candidate libraries/approaches (e.g. react-native-vision-camera + a text-recognition frame processor, Expo-compatible text-extraction modules, a small custom Expo module) for SDK 58 / New Architecture compatibility, maintenance, licensing, offline on-device recognition, and accuracy on windshield VIN plates (glare, I/1, O/0, S/5 confusions — how check-digit validation and candidate correction help). Also note whether door-jamb barcode scanning comes nearly free with the same camera stack. Recommend one approach; list open questions.

## Answer

Researched 2026-10-26. Full write-up: [vin-camera-scanning.md](../research/vin-camera-scanning.md).

- No Expo first-party OCR: `expo-camera` (SDK 58) does photos and barcodes (`code39`, `code128`, `datamatrix`, `qr`, …) and its `launchScanner` uses VisionKit `DataScannerViewController` for barcodes only.
- **Recommended:** one camera stack — `expo-camera` — for QR transfer, door-jamb VIN barcode and VIN photo; OCR on the captured photo through a **small local Expo module** (Apple Vision `VNRecognizeTextRequest` on iOS — zero added size; ML Kit Text Recognition v2 on Android), tuned for VINs (language correction off, multiple candidates, region of interest). Candidate extraction, confusable-char correction (I/O/Q always mapped; S/5, B/8, Z/2, G/6, D/0 tried), check-digit filtering and multi-shot voting live in `packages/shared`. OCR proposes, the user confirms in the editable VIN field.
- `expo-text-extractor` (MIT) is a viable fallback/reference but has VIN-hostile defaults (language correction on, top-1 only) and an open Android `file://` bug.
- Live scanning (VisionCamera v5 + `react-native-vision-camera-mlkit` / `-ocr-plus`) is the upgrade path, not v1: adds Nitro + worklets, replaces expo-camera everywhere, ML Kit on iOS (no arm64-simulator slice), and VisionCamera's last release (2026-08-20) predates RN 0.88 — unverified on SDK 58. DataScannerViewController text mode is iOS-only → possible later iOS enhancement.
- Door-jamb barcode detection comes nearly free with `expo-camera` and short-circuits OCR.

Open questions for the human:
1. Capture-photo UX acceptable for v1, or is live scanning required?
2. OK to own a small Swift + Kotlin module in the repo?
3. Android ML Kit bundled (+~4 MB/ABI, offline) or unbundled (needs Play services + download)?
4. Door-jamb barcode in v1, and hint users toward the door-jamb sticker first?
5. QR transfer: shared custom scanner screen or system `launchScanner` modal?
6. Acceptable to add an iOS-only live path later (different UX per platform)?
