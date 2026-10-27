# Odometer scanning approach

Type: research
Status: resolved
Blocked by:

## Question

How do we read the odometer with the camera in v1, reusing the live scanner stack (VisionCamera 5.2.3 + react-native-vision-camera-mlkit, see [Live VIN scanner feasibility spike](13-live-vin-scanner-spike.md))? Digital (LCD/TFT, segment fonts) vs analog/mechanical odometers, trip-meter vs odometer confusion, mi vs km display, glare at night. Is ML Kit text recognition good enough (seven-segment digits are a known weak spot), or is a dedicated model needed? Candidate heuristics (largest number, 'mi'/'ODO' anchors, plausibility vs current mileage). Recommend live vs photo for odometer, the UX (confirm editable value), and open questions.

## Answer

2026-10-26 — full write-up: [../research/odometer-scanning.md](../research/odometer-scanning.md)

**Recommendation (the human decides):**
- Reuse the live scanner screen and ML Kit Latin text recognition in a text-only **odometer mode**: a wide 2:1 guide box as `roi`, and a torch toggle that is off by default.
- Typing stays the default. Every scan result lands in an **always-editable numeric field** the Owner confirms, and the normal ADR-0007 check runs on submit. Nothing auto-saves.
- A pure candidate picker in `packages/shared`:
  - digit runs of 1–7 digits, with confusable repair
  - positive anchors `ODO`/`mi`/`miles`
  - negative anchors that discard: `TRIP`/`A`/`B`, temperature, clock, `RANGE`, `mpg`, `mph`, `%`
  - tenths dropped, glyph height as a ranking signal
  - ADR-0007 bounds used for ranking, never as a silent filter
- Then a multi-frame vote before locking (same value in ≥3 frames and ≥60% of a ~1.5 s window). Ambiguous results (mid-roll drum digits, 6 vs 7 digits) show as 2 choice chips. After ~6 s with no lock, show a "type it / take a photo" fallback.
- **Live over photo** (voting filters glare and flicker), with a shutter button that uses the plugin's static `recognizeImage` as fallback.
- **No dedicated model in v1.** Escalation path if the device test fails, in rising cost:
  - custom TFLite model trained on TRODO (CC BY 4.0) via `react-native-fast-tflite`, ~3–6 weeks
  - Anyline (digital odometers only per its SDK docs; quote-based, ~€457/mo+ on Capterra)
  - server-side VLM (breaks offline, cost-abuse risk without auth)

**Honest accuracy (unmeasured, nobody publishes ML Kit odometer numbers):**
- Good on TFT/proportional-font clusters.
- Unreliable on seven-segment LCDs. Apple says Vision doesn't support segmented digits, and Google Cloud OCR read only ~59% of seven-segment meter images exactly.
- Moderate on mechanical drums.
- Even a purpose-built odometer model reached only 85–90% exact.

Suggested ~1 h on-device test with the spike app before the spec locks (research §7).

**Open questions for the human:**
1. Accept ML Kit-only for v1 (older cars often fall back to typing), or is reliable scanning on segment/mechanical odometers a v1 requirement?
2. Live with auto-lock plus shutter (recommended), or photo-only?
3. km displays: warn and block, warn and offer a ×0.621 conversion, or ignore?
4. Tenths: drop and store integer miles (recommended)?
5. Max odometer in the shared schema: 999,999 or 9,999,999?
6. Run the §7 device test before the spec locks, or make it the first implementation ticket?
7. Server-side VLM fallback off the table for v1?
