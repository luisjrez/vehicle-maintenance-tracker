# Live scanner device validation

Type: task
Status: resolved
Blocked by: 13

## Question

Does the spike build (VisionCamera 5.2.3 + react-native-vision-camera-mlkit 2.0.1) actually scan on physical phones? HITL: the human runs the checklist in §7 of [live-vin-scanner-spike.md](../research/live-vin-scanner-spike.md) on the human's **iPhone** (Android is not device-validated before implementation — accepted risk) (QR, door-jamb barcode, windshield VIN plate in daylight/shade, printed VIN, **and the odometer** of real cars per the ~1 h test in [odometer-scanning.md](../research/odometer-scanning.md); 2–3 min stability; background/foreground). Record: what was read, misreads vs the real VIN, crashes. Outcome: the spec commits to the library path, or falls back to the custom Expo module (~9–12 days).

## Answer

Resolved 2026-10-26. The spike was rebuilt as a signed Release build (Personal Team, bundle `dev.luisjrez.vinscannerspike`) with an on-screen results panel (barcode/QR, VIN text with check-digit ✓/✗, odometer number candidates, frame counter), installed and launched on the user's iPhone 17 Pro Max (iOS 26.6) via `devicectl`.

User report: **"in most cases it works without problems, relatively well."** No per-item breakdown (VIN plate vs door-jamb vs odometer type) or crash report was captured.

**Outcome: the spec commits to the library path** — VisionCamera 5.2.3 + react-native-vision-camera-mlkit 2.0.1 (exact pins), replacing `expo-camera`. The custom Expo module stays as the documented fallback ([live-vin-scanner-spike.md](../research/live-vin-scanner-spike.md) §fallback).

Residual risks: Android not device-tested; odometer accuracy on seven-segment LCDs unmeasured; VisionCamera open crash issues — mitigate with exact pins, never throwing inside frame processors, and early real-device QA in implementation.
