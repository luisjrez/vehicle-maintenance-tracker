# ADR-0006: Live VIN scanning on both platforms

Status: accepted (2026-10-26)

## Context

Most windshield VIN plates are printed text; many door-jamb stickers carry a barcode. Research (`.scratch/vehicle-maintenance-tracker/research/vin-camera-scanning.md`) recommended photo-capture OCR; the user chose live scanning.

## Decision

- v1 ships live, on-device VIN scanning on iOS and Android: text recognition (VIN plate) and barcode (door jamb) in one camera session, plus QR for device transfer, all in a single well-organized scanner screen.
- Prefer an existing library that works on Expo SDK 58 / RN 0.88 (candidate: VisionCamera v5 + ML Kit text recognition plugin); otherwise build a custom native module (Expo Modules API + config plugin, or a Turbo Module).
- Android ML Kit is bundled. Recognition results pass through the shared VIN normalizer/check-digit validator and fill an editable field the Owner confirms.

## Consequences

- If VisionCamera is chosen it replaces `expo-camera` for every camera use (QR, barcode, text).
- Feasibility on SDK 58 is unverified → spike before the spec locks the library.
- Real-device testing on both platforms is required; the iOS simulator has no camera, tests need a JS mock.
