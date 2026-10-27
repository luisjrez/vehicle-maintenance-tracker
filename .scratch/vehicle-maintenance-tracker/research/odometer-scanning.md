# Odometer scanning approach

Research for [15 — Odometer scanning approach](../issues/15-odometer-scanning-approach.md), written **2026-10-26**. It builds on the [live VIN scanner spike](live-vin-scanner-spike.md) (VisionCamera 5.2.3 + `react-native-vision-camera-mlkit` 2.0.1), [ADR-0006](../../../docs/adr/0006-live-vin-scanning.md) and [ADR-0007](../../../docs/adr/0007-odometer-consistency.md).

This document **recommends**. The human decides.

## TL;DR

- **Recommended:** reuse the same live scanner screen and the same ML Kit Latin text recognizer, with a separate **odometer mode**:
  - a wide 2:1 guide box used as the ML Kit `roi`
  - a pure candidate picker plus a multi-frame vote in `packages/shared`
  - a torch toggle
  - the result **always** goes into an editable numeric field the Owner confirms. Nothing auto-saves.
- Typing the number is the primary path and is always one tap away. Scanning is a convenience, not something the flow depends on.
- **No dedicated model in v1.** ML Kit is free, already in the binary and offline. A custom model (TFLite) or a commercial SDK costs weeks or a license, with no proof yet that we need either. Decide after a measured on-device test (§7).
- **Honest accuracy expectation (not measured, nobody publishes ML Kit odometer numbers):**
  - **Good** on TFT/LCD clusters that render digits in a normal proportional font. Most US cars from roughly the last decade work this way.
  - **Unreliable** on classic **seven-segment LCD** odometers. Apple says its Vision text recognizer does not support segmented digits, and Google's cloud OCR read only ~59% of seven-segment meter images exactly.
  - **Moderate** on mechanical drum odometers, with specific errors on the tenths wheel and on digits caught mid-roll.
- Live is better than a single photo for this target. Glare and backlight flicker change frame to frame, and voting across frames filters them out. A shutter button is still offered as a fallback (static `recognizeImage` exists in the plugin).

## 1. What we are reading (US market, miles)

| Display type | Typical vehicles | What OCR sees | Specific traps |
|---|---|---|---|
| **TFT / full-digital cluster** | Most cars from ~2015 on, all EVs | Antialiased proportional font, often with `ODO` / `mi` labels | The screen may show trip, range, average mpg, outside temperature and clock at the same time. Some clusters show the odometer only on a specific screen or for a few seconds after ignition. Moiré and refresh banding at some exposures. |
| **Segment LCD (seven-segment)** | Many 1995–2015 cars (one-line odometer/trip LCD under the speedometer) | Digits made of separated bars, light on dark or dark on green/amber | Generic OCR models are trained on printed/scene text and often miss segment digits or misread them (`1`/`7`, `5`/`6`, `8`/`0`/`9`). Backlight glare. The value usually toggles between ODO and TRIP A/B on the same digits. |
| **Mechanical drum** | Older cars (mostly pre-2000s) | Printed digits on rotating wheels behind a curved lens | Rightmost wheel is often **tenths**, set apart by a different color or a decimal point ([NIST HB44 §5.53](https://www.nist.gov/document/2026-nist-handbook-44-section-553)). Some have no tenths wheel at all. Digits caught **between positions** (is it 8 or 9?). Lens reflections. Five-digit units roll over at 99,999. |

Other traps that apply to every display type:
- **Units.** v1 is miles only. A grey-market or Canadian car may show km. The unit label (`mi`/`km`) is often visible next to the number. If we see `km`, we should **not convert silently**. Warn and let the Owner decide (open question Q3).
- **Trip vs odometer.** Trip values are usually shorter and often have a decimal (`123.4`). Odometer values are integers in the thousands to hundreds of thousands. The `TRIP`/`A`/`B` label is the strongest negative anchor.
- **Night and glare.** Backlit clusters at night are high contrast but blow out at auto exposure. In daylight the cluster glass reflects the windshield. A torch usually *hurts*, because it reflects off the glass. Offer it but don't default to it.

## 2. How well generic OCR reads odometers (evidence)

No source publishes ML Kit Text Recognition v2 accuracy on odometers. The closest evidence:

- **Apple Vision:** an Apple Frameworks Engineer stated that `VNRecognizeTextRequest` does **not support segmented LCD/LED digits** and recommended training a custom model ([Apple Developer Forums, 2020](https://developer.apple.com/forums/thread/651059); asked again in 2022, no reply). This matters only for the custom-module fallback in the spike doc §6. The chosen stack uses ML Kit on iOS too.
- **Generic cloud OCR on seven-segment meters:** five commercial OCR APIs compared on electricity-meter seven-segment displays with no preprocessing. Google Cloud was best: **100/169 images exact (≈59%)** and 86.5% of digits. The authors concluded that none was production-ready without preprocessing ([ENCompIF 2021](https://sol.sbc.org.br/index.php/encompif/article/view/15948)). ML Kit on-device is a smaller model than Google Cloud Vision, so expect no better on segment digits.
- **Dedicated odometer pipeline:** a two-stage Faster R-CNN (locate the display, then detect digits) trained on ~6,200 insurance-claim odometer photos reached **85.4% exact mileage** on the full test set and **90%** on good-quality photos. The authors said Tesseract and MATLAB OCR "perform poorly" and that Google Cloud Vision was "not close" to their needs. **~15% of their errors came from post-processing:** picking the trip meter or another number, and reading the tenths digit as part of the mileage ([Frontiers in Applied Mathematics and Statistics, 2019](https://frontiersin.org/article/10.3389/fams.2019.00061/full)). So even a purpose-built model is wrong about 1 time in 10, and the candidate-picking heuristics matter as much as the recognizer.
- **Seven-segment specialist models:** a 2024 benchmark found PARSeq best on the 7Seg dataset and named LED bleeding, glare and nearby printed text as the main degraders ([ITM Web of Conferences 2024](https://www.itm-conferences.org/articles/itmconf/abs/2024/06/itmconf_amict2023_01007/itmconf_amict2023_01007.html), abstract). Classic non-ML tools exist (e.g. [ssocr](https://www.unix-ag.uni-kl.de/~auerswal/ssocr/)) but need fixed framing and thresholds.
- **Practitioner reports:** ML Kit on mechanical meter counters gave garbled output. Commenters noted that a fixed crop frame helps but does not fix it, and that mid-roll digits are inherently ambiguous ([B4X forum thread](https://www.b4x.com/android/forum/threads/mlkit-and-numbers-digits-detection-recognition.165826/latest)).
- **ML Kit input guidance:** characters should be at least **16×16 px**, with no gain above 24×24. Text should fill the frame. Drop frames while the detector is busy ([ML Kit text recognition v2, Android guide](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)). An odometer is small on the cluster, so the guide box must make the Owner hold the phone close enough that digits reach that size.
- **Vision-language models:** no odometer benchmark found. On gauge and dial reading, frontier VLMs do poorly at strict tolerance ([MeasureBench 2025](https://arxiv.org/abs/2510.26865v1), [DialBench 2025](https://arxiv.org/pdf/2511.21982)). Digit displays are an easier task than dials, but this is still unproven. Some fleet apps ship Gemini-based meter reading ([FleetGit listing](https://apps.apple.com/us/app/fleetgit/id6758312644)).

**What the plugin gives us** (read from `react-native-vision-camera-mlkit` 2.0.1 sources in the spike):
- `roi` (crop before recognition), `invertColors`, `scaleFactor`, and a static `recognizeImage(uri)`.
- Results are blocks → lines → elements, each with bounds and corners.
- `confidence` and per-symbol data are **Android-only** (`null` on iOS), so the heuristics cannot rely on confidence.

## 3. Picking the odometer value from recognized text

Put this in `packages/shared` as a **pure function** (frame result in, ranked candidates out) plus a small voting accumulator. It needs no native code and is unit-testable with recorded ML Kit JSON fixtures. Proposed pipeline:

1. **Restrict to the ROI.** Only text whose box lies mostly inside the guide box counts.
2. **Tokenize numbers.**
   - Take digit runs per element/line.
   - Allow a thousands separator (`12,345`), a decimal tenths part (`12345.6`) and a thin space.
   - Repair common confusables **only inside digit runs**: `O/D/Q→0`, `I/l/|→1`, `S→5`, `B→8`, `Z→2`. This mirrors the VIN confusable map, inverted toward digits.
3. **Classify by nearby labels** (same line or adjacent block):
   - Positive anchors: `ODO`, `ODOMETER`, `mi`, `miles`, `MILES`.
   - Negative anchors that discard the token: `TRIP`, `A`/`B` next to the number, `km/h`, `mph`, `°F`/`°C`, `RANGE`, `mpg`, `MPGe`, `avg`, `AM`/`PM`, clock pattern `\d{1,2}:\d{2}`, `%`.
   - `km` is a unit warning, not a discard.
4. **Shape filter.**
   - Integer part of **1–7 digits**. Ranking prefers 4–6 digits. Valid range `0..999,999` (the shared schema max is open question Q5).
   - Drop a **decimal tenths** part (`.6`) and keep the integer. Decimals are a strong *trip* signal when no anchor is present.
   - A 7-digit run on a mechanical display is most likely 6 digits plus tenths. Do not guess. Present it as an ambiguity, e.g. candidates `123456` and `1234567` (the same 7-digit rule as the Frontiers 2019 pipeline, but surfaced to the user).
5. **Rank.** Score = anchor bonus + digit-count prior + **glyph height**. The odometer is usually the largest numeric text in the ROI, and line/element bounds give height. Penalties apply for a decimal or for sitting above or below a `TRIP` label.
6. **Plausibility (ranking, never a silent filter).**
   - *Adding a vehicle:* no prior. Plausibility is only 0–999,999.
   - *Adding a record:* ADR-0007 already bounds the value for the record's date (≥ highest earlier reading, ≤ lowest later reading). A candidate outside the bounds is down-ranked and shown with the same consistency error the form would give. It is not hidden, because the stored history might be the thing that is wrong.
   - Also, a candidate that differs from the expected range by a factor of about 1.6 hints at km instead of mi (open question Q3).
7. **Multi-frame vote before lock.**
   - Keep a sliding window of about 1.5 s (or the last ~8 processed frames).
   - **Lock** when the same normalized integer wins in **≥3 frames, with ≥60% of the window's votes**, and no competitor is within 1 vote.
   - Haptic tick, then freeze the preview and show the value.
   - On mechanical drums a mid-roll digit flips between frames. If it never stabilizes, show the top two candidates instead of locking.
8. **Timeout.** With no lock after about 6 s, show "Can't read it — type it instead / take a photo". Do not keep the camera running forever (thermal and battery cost, VisionCamera issues noted in the spike).

## 4. Live vs photo, and the UX

**Recommendation: live with auto-lock, a manual shutter fallback, and an always-editable result.**

- **Entry points:** the odometer field on *Add vehicle* (required initial odometer) and on *Service record* (optional). Each has a camera icon in the field. Tapping it opens the shared scanner screen in odometer mode. The keypad stays the default focus. Scanning never blocks typing.
- **Guide frame:** a wide box at about 2:1 (Anyline uses the same ratio for its odometer scanner and warns that changing it hurts accuracy, see [Anyline odometer docs](https://documentation.anyline.com/ios-sdk-component/56.0.1/technical-capabilities/odometer.html)). Hint text: "Fit the ODO number in the box (not TRIP)". The box doubles as `roi`. Live overlay: draw the current best candidate's box so the Owner sees what is being read.
- **Controls:** torch toggle (off by default), shutter button. The shutter runs `recognizeImage` on a still photo, which uses a higher resolution and lets the Owner frame a dim cluster. "Type instead" button.
- **Confirm step (always):**
  - After lock or shutter, return to the form with the value filled in a **numeric field that stays editable**, formatted `en-US` (`123,456 mi`).
  - Small text under it: "Scanned — check it matches your dash".
  - If the result was ambiguous, show 2 chips (e.g. `123,456` / `1,234,567`) and let the Owner pick.
  - Nothing saves without the normal form submit, which runs the ADR-0007 check.
- **Do not store the photo** in v1. It is not needed, it holds no evidence value without accounts, and it avoids storage and privacy scope.
- **Frame budget:**
  - Odometer mode runs **text only**. Barcode scanning is off in this mode, which halves per-frame work compared with VIN mode.
  - Text runs on every 2nd–3rd frame with `roi` crop, matching ML Kit's "drop frames while busy" advice.

Why live beats photo here:
- Voting across frames removes transient glare, backlight flicker and single-frame misreads, which are the dominant failure sources in the literature.
- The Owner gets feedback (the candidate box) while still aiming.
- It is the same screen and engine as VIN scanning (ADR-0006), so it adds little cost.

Photo-only is simpler but gives one shot per press and no feedback. Keep it as the shutter fallback, not the primary mode.

## 5. Is a dedicated model needed?

**Not for v1, unless the device test (§7) shows ML Kit fails on the cars the human actually cares about.** Options if it does, in rising cost:

| Option | What it is | Cost | Notes |
|---|---|---|---|
| **A. ML Kit + heuristics (recommended)** | §3 on the existing stack | ~3–5 dev days (shared picker + voting + fixtures, scanner mode, field UI) | Free, offline, no new native deps. Weak on seven-segment. |
| **A+. Preprocessing tweaks** | `invertColors` for dark-on-light segment LCDs, a narrower ROI, higher frame resolution for the still capture | ~1–2 days on top, empirical | May lift segment LCD somewhat. The ENCompIF study says preprocessing is the main lever for generic OCR. |
| **B. Custom TFLite digit model** | Detector + digit recognizer (or PARSeq-like) trained on [TRODO](https://pmc.ncbi.nlm.nih.gov/articles/PMC8424208/) (2,389 images, 858 analog / 1,531 digital, per-digit boxes, **CC BY 4.0** on [Mendeley Data](https://data.mendeley.com/datasets/6y8m379mkt/2)) plus our own US photos. Run via [`react-native-fast-tflite`](https://github.com/mrousavy/react-native-fast-tflite) 3.0.1 (Nitro based, same family as VisionCamera v5) in the frame processor. | **~3–6 weeks**: data labeling for US/miles clusters, training, quantization, native integration, and on-device testing on both platforms. Ongoing model ownership. | TRODO comes from a Turkish university, so units and clusters likely skew km and non-US. The [Roboflow "Odometer Trodo Combined"](https://universe.roboflow.com/image-processing-ldohg/odometer-trodo-combined-v.3-pwres) set and an [IEEE motorcycle odometer set](https://ieee-dataport.org/documents/comprehensive-dataset-motorcycle-odometer-images-analog-and-digital) exist but were not checked in detail. Expected ceiling is about 85–90% exact (the Frontiers 2019 result). Adds a few MB to the binary. |
| **C. Commercial SDK (Anyline)** | [Anyline odometer scanner](https://anyline.com/products/odometer-scanner): reads **digital odometers up to 7 digits**, offline ([docs](https://documentation.anyline.com/ios-sdk-component/56.0.1/technical-capabilities/odometer.html)). Marketing claims analog too (via the cloud API / TireBuddy). | Quote-only license. Third-party listings show it **from ~€457/month, usage-based** ([Capterra](https://www.capterra.com/p/178754/Anyline/)). Separate native SDK plus RN wrapper, and a second camera stack next to VisionCamera. | No published accuracy. Enterprise-priced for a free personal app. Scandit, Microblink and Klippa have **no** odometer product (Klippa does utility meters only). |
| **D. Server-side VLM (e.g. Gemini) via our API** | Upload the still photo to NestJS, which calls a vision LLM and returns the number | ~3–5 days plus per-call cost, network required | Breaks offline. Sends cluster photos off-device. With no auth, an open endpoint that spends money per call is an abuse risk (needs per-Device rate limits). Accuracy on odometers is unbenchmarked, and VLMs are poor on dials. |

## 6. Risks

- **Seven-segment LCD misreads.** This is the known weak spot of every generic OCR. Mitigation: voting, ambiguity chips, always-confirm, easy typing. Accept a lower scan success rate on that display type in v1.
- **Plausible but wrong values** are the worst case: a confident misread that passes ADR-0007, e.g. `128,456` vs `123,456`. They corrupt derived current mileage. The only real defense is the confirm step. The UI must make checking the value the obvious thing to do, not a click-through. The research doesn't support auto-saving a scanned value.
- **Trip picked instead of ODO.** Mitigated by negative anchors and the decimal penalty. ADR-0007 catches most of these on records (a trip value is usually far below the history). It catches nothing on *Add vehicle*, which has no prior.
- **km cluster in a miles-only app.** Mitigated by the unit warning. Policy is open (Q3).
- **Library runtime health** (spike §4, e.g. iOS release crash on a thrown frame-callback exception, #4219). The same mitigations apply: never throw out of the worklet, keep the picker pure, and keep the native result mapping defensive.
- **Accuracy unmeasured.** Every number above is from proxies. The decision should wait for §7.

## 7. Suggested on-device test (human, ~1 hour, reuses the spike app)

Add an odometer log line to the spike's worklet. Print every 4–7-digit run with its line text and box height. Then try the following on whatever cars are at hand, 3 attempts each, day and night:
- [ ] one TFT/digital cluster
- [ ] one segment-LCD cluster
- [ ] one mechanical drum, if available
- [ ] a screenshot of a TRODO image on a laptop as a control

Record for each: read correctly in ≥3 of the first ~8 processed frames (yes/no), common misreads, and whether the trip value was also read.

Pass bar for "A is enough for v1": TFT reads correctly and stably. Segment LCD reads at least sometimes, and failures show up as no candidate or a wrong one, not a crash. If TFT is also poor, revisit §5 B/D before the spec locks.

## 8. Open questions for the human

1. **Accept ML Kit-only for v1** knowing segment-LCD and mechanical odometers may often fall back to typing? Or is scan reliability on older cars a v1 requirement (which means option B, C or D)?
2. **Live with auto-lock plus shutter fallback** (recommended), or photo-only for odometer (simpler, less code)?
3. **km displays:** warn and block scan fill, warn and offer a ×0.621 conversion, or ignore (miles-only means the Owner types)?
4. **Tenths:** always drop (store integer miles), or does the domain want tenths? Recommendation: integer miles only. The schema and ADR-0007 compare integers.
5. **Max odometer value** for the shared schema: 999,999 (six-digit clusters) or 9,999,999?
6. **Run the §7 test before the spec locks**, or lock the spec on option A and treat the test as the first implementation ticket?
7. **Server-side VLM fallback (D)** is off the table for v1? It conflicts with offline use and the no-auth cost-abuse posture.

## Sources

- Odometer mileage extraction with SSD vs Faster R-CNN (doi 10.3389/fams.2019.00061), Frontiers in Applied Mathematics and Statistics, 2019: <https://frontiersin.org/article/10.3389/fams.2019.00061/full>
- Mouheb, Yürekli, Yılmazel, "TRODO: A public vehicle odometers dataset for computer vision", Data in Brief, 2021: <https://pmc.ncbi.nlm.nih.gov/articles/PMC8424208/>. Dataset (CC BY 4.0): <https://data.mendeley.com/datasets/6y8m379mkt/2>
- Roboflow Universe, Odometer Trodo Combined v3: <https://universe.roboflow.com/image-processing-ldohg/odometer-trodo-combined-v.3-pwres>
- IEEE DataPort, motorcycle odometer images (analog and digital): <https://ieee-dataport.org/documents/comprehensive-dataset-motorcycle-odometer-images-analog-and-digital>
- "Comparison of OCR APIs for Digit Recognition in Seven Segment Display Images", ENCompIF 2021: <https://sol.sbc.org.br/index.php/encompif/article/view/15948>
- Seven-segment recognition benchmark (PARSeq on 7Seg), ITM Web of Conferences 2024 (abstract via search, page returned 403): <https://www.itm-conferences.org/articles/itmconf/abs/2024/06/itmconf_amict2023_01007/itmconf_amict2023_01007.html>
- Apple Developer Forums, "Recognizing LCD/LED number digits" (Apple Frameworks Engineer answer): <https://developer.apple.com/forums/thread/651059>
- Google ML Kit Text Recognition v2, Android guide (input guidelines, real-time tips, bundled size): <https://developers.google.com/ml-kit/vision/text-recognition/v2/android>
- ssocr (seven-segment OCR): <https://www.unix-ag.uni-kl.de/~auerswal/ssocr/>
- B4X forum, "MLKIT and Numbers, Digits Detection/Recognition": <https://www.b4x.com/android/forum/threads/mlkit-and-numbers-digits-detection-recognition.165826/latest>
- NIST Handbook 44 §5.53 Odometers (tenths differentiation): <https://www.nist.gov/document/2026-nist-handbook-44-section-553>
- Anyline odometer scanner, iOS SDK 56.0.1 docs: <https://documentation.anyline.com/ios-sdk-component/56.0.1/technical-capabilities/odometer.html>. Product page: <https://anyline.com/products/odometer-scanner>. Capterra pricing listing: <https://www.capterra.com/p/178754/Anyline/>
- Klippa utility meter SDK (no odometer product): <https://klippa.com/en/dochorizon/mobile-scanning/utility-meter-scanning-sdk>
- MeasureBench (VLM measurement reading): <https://arxiv.org/abs/2510.26865v1>. DialBench: <https://arxiv.org/pdf/2511.21982>
- FleetGit (Gemini Vision meter reading): <https://apps.apple.com/us/app/fleetgit/id6758312644>
- `react-native-fast-tflite` (npm 3.0.1, checked 2026-10-26): <https://github.com/mrousavy/react-native-fast-tflite>
- `react-native-vision-camera-mlkit` 2.0.1 sources in the spike app (`src/specs/MLKitVisionTypes.ts`, `src/features/text-recognition/types.ts`, `src/specs/TextRecognizer.nitro.ts`)
