# Live VIN scanner feasibility spike

Type: task
Status: resolved
Blocked by:

## Question

Can live VIN scanning (text + door-jamb barcode + QR in one camera session) run on Expo SDK 58 / RN 0.88 with an existing library — e.g. VisionCamera v5 + an ML Kit text-recognition frame-processor plugin — or do we need a custom native module (Expo Modules API + config plugin / Turbo Module)? Build a throwaway dev-build app outside the repo (scratch), confirm it installs, prebuilds and compiles for iOS and Android, record versions, blockers and workarounds. Hand the human a short checklist to try it on a physical device (accuracy on a real windshield plate and door-jamb sticker). Answer: which approach the spec should commit to.

## Answer

_2026-10-26_

**Use the library path: VisionCamera 5.2.3 + `react-native-vision-camera-mlkit` 2.0.1.** ML Kit text recognition and barcode scanning (Code 39, Code 128, Data Matrix, QR) run in one `useFrameOutput` worklet, in one camera session, and this replaces `expo-camera`. The recommendation holds only if the physical-device checklist passes.

- I ran these builds of a throwaway Expo SDK 58 / RN 0.88 / New Arch dev-build app. None needed patches:
  - `expo prebuild`: OK
  - iOS device build (`iphoneos`, unsigned): **succeeded**
  - iOS Simulator x86_64: **succeeded**
  - Android `assembleDebug` (arm64-v8a, bundled ML Kit): **succeeded**
  - Metro bundle with the worklet transform: OK
- iOS Simulator arm64 **cannot** build. ML Kit pods exclude arm64 for the simulator. This doesn't block anything, since the simulator has no camera. Use x86_64/Rosetta for simulator UI work.
- **Not verified:** runtime behavior and accuracy. No physical device was used.
- Two config requirements for the real app:
  - Set the plugin's CJK and Devanagari flags to `false`, because its defaults bundle all scripts.
  - Keep `android.builtInKotlin=false`, which the SDK 58 template already sets.
- Maintenance risks: VisionCamera has not released since 2026-08-20 (before RN 0.88), and merges are slow. Its open crash issues are #4219, #4209, #4211 and #4213. The mlkit plugin has a single maintainer. Mitigations: pin exact versions, never throw inside a worklet, and keep VIN logic behind a port in `packages/shared`.
- Fallback, outlined but not built: a custom Expo module (AVFoundation + Vision + AVMetadataOutput on iOS; CameraX + ML Kit on Android). Estimated at about 9–12 working days.

Full write-up: [../research/live-vin-scanner-spike.md](../research/live-vin-scanner-spike.md). §7 there has the human checklist for running the spike on a physical iPhone and Android phone.

Spike app (outside the repo, throwaway): `/private/tmp/claude-501/-Users-luisjuarez-dev-mobile-automobile-service-tracker/009d0d92-75d4-45dc-a2f9-cfc35f75586a/scratchpad/vin-scanner-spike`. Build logs are in the same folder. `/private/tmp` may be wiped on reboot, so copy the folder somewhere permanent before testing.
