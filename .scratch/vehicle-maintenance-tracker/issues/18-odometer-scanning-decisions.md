# Odometer scanning decisions

Type: grilling
Status: resolved
Blocked by:

## Question

Decide the open questions from [Odometer scanning approach](15-odometer-scanning-approach.md) ([odometer-scanning.md](../research/odometer-scanning.md)): ML Kit-only in v1 (segment LCD / mechanical drums often fall back to typing) vs a hard requirement for those; live auto-lock + shutter vs photo-only; km-displaying cars (block / convert / ignore); drop tenths and store whole miles; odometer upper bound (999,999 vs 9,999,999); device test before the spec locks vs first implementation ticket (cf. [Live scanner device validation](14-live-scanner-device-validation.md)); server-side vision-LLM fallback off the table for v1.

## Answer

Resolved 2026-10-26 (grilling; the user answered 6–7 explicitly and did not object to the recommendations for 1–5).

1. **ML Kit only in v1.** Good on modern TFT clusters; segment LCD / mechanical drums fall back to typing after ~6 s without a lock. No dedicated model, no paid SDK.
2. **Live with stable auto-lock** (≥3 frames, ≥60% of a ~1.5 s window; ambiguous → show both choices) **+ shutter fallback**; same scanner screen in a text-only odometer mode with a wide 2:1 guide box and a torch toggle (off by default). Value always lands in an editable field; the Owner confirms.
3. **km displays:** detect "km" next to the number → warn and offer conversion to miles, with confirmation.
4. **Tenths dropped;** whole miles stored.
5. **Odometer bounds:** 0–9,999,999 mi in the shared schema.
6. **Device test:** the user validates on **their iPhone** together with [Live scanner device validation](14-live-scanner-device-validation.md), before the spec locks. Android is not device-validated before implementation (accepted risk; compile-only from the spike).
7. **No server-side vision-LLM fallback.**

Candidate picker (ODO/mi anchors, ignore TRIP/temp/clock/range, rank by plausibility vs ADR-0007 bounds without hiding candidates) lives in `packages/shared` as a pure function.
