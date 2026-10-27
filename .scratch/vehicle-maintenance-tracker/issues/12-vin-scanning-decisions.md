# VIN scanning decisions

Type: grilling
Status: resolved
Blocked by:

## Question

Decide the open questions from [VIN camera scanning approach](11-vin-camera-scanning-approach.md) ([vin-camera-scanning.md](../research/vin-camera-scanning.md)): photo-capture OCR vs live point-and-lock scanning in v1; owning a small in-repo Expo module (Swift Vision + Kotlin ML Kit) vs `expo-text-extractor`; ML Kit bundled vs unbundled on Android; door-jamb barcode detection in v1 and whether the scanner steers users to the door-jamb sticker first; QR transfer sharing the custom scanner screen vs system `launchScanner`; acceptability of a later iOS-only live path.

## Answer

Resolved 2026-10-26 (grilling with the user). Recorded as [ADR-0006](../../../docs/adr/0006-live-vin-scanning.md).

1. **Live scanning in v1 on both platforms** — point the phone, the VIN locks in; no photo-capture step.
2. **Use an existing library if one works** on Expo SDK 58 / RN 0.88 (e.g. VisionCamera v5 + an ML Kit text-recognition plugin); **otherwise a custom native module** (Expo Modules API with a config plugin if needed, or a Turbo Module). Feasibility → [Live VIN scanner feasibility spike](13-live-vin-scanner-spike.md).
3. **Android ML Kit bundled** in the app (offline from first use).
4. **Door-jamb barcode scanning in v1** too (Code 39 / Code 128 / Data Matrix).
5. **One scanner screen**, well organized, shared by VIN text, VIN barcode and the QR transfer flow.
6. Recognized VINs go through the shared normalizer + check-digit validator and fill the editable VIN field; the Owner confirms.
