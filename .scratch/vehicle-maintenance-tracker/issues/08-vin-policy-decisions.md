# VIN policy decisions

Type: grilling
Status: resolved
Blocked by:

## Question

Decide the open questions left by [VIN validation and decoding policy](04-vin-validation-and-decoding-policy.md) (recommendations in [vin-validation-and-decoding.md](../research/vin-validation-and-decoding.md)): VIN optional vs required; reject vs warn on a bad check digit; which decoded fields are shown/editable in v1; whether user edits survive a re-decode; same VIN allowed across Owners; VIN capture (typing only vs camera barcode/OCR) in v1; max vehicles per Owner; decode cache lifetime and a "refresh details" action.

## Answer

Resolved 2026-10-26 (grilling with the user). Recorded as [ADR-0003](../../../docs/adr/0003-vin-policy.md).

1. **VIN is optional.** A vehicle is added either by VIN (decoded) or by picking make/model/year manually.
2. **Invalid VIN is rejected** (format, I/O/Q, year code, check digit) and the app offers "Add without VIN" to continue.
3. **Show all decoded details** in v1 (make, model, year, trim, body class, vehicle type, fuel type/electrification, cylinders, displacement, drive type) — the vehicle detail screen gives the Owner specific info about their car.
4. **Decoded data is editable before and after saving.** No automatic re-decode overwrites Owner edits.
5. **Same VIN allowed across Owners** (e.g. a sold car registered by its new owner). Unique per Owner only.
6. **VIN capture: type/paste or scan with the camera using native OCR** (most windshield VIN plates are printed text, not barcodes). OCR output goes through the same normalization + check-digit validation, which catches misreads. Library/approach → [VIN camera scanning approach](11-vin-camera-scanning-approach.md).
7. **Max 20 vehicles per Owner** (abuse guard for an unauthenticated API).
8. **Caching in two layers:**
   - API: shared server-side cache of vPIC decode results per VIN (hits kept indefinitely, "no data" ~24 h, outages not cached) — protects the free vPIC API.
   - App: Owner's vehicle data persisted locally in **MMKV**; refreshed from our API at most **once a day** for the saved vehicles, otherwise served from MMKV.
