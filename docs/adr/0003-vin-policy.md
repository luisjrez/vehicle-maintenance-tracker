# ADR-0003: VIN policy — optional, strict, decoded via our API, cached in two layers

Status: accepted (2026-10-26)

## Context

v1 targets US-market vehicles. NHTSA vPIC is free and keyless but always returns HTTP 200, decodes VINs with typos, and has best-effort uptime. Owners also have cars vPIC cannot decode (pre-1981, gray imports).

## Decision

- VIN is optional; manual make/model/year entry is always available.
- A provided VIN is normalized (trim, strip spaces/dashes, uppercase) and validated strictly — 17 chars, no I/O/Q, valid model-year code, numeric serial (positions 14–17, or 15–17 for small manufacturers), matching check digit — by a validator in `packages/shared`, used by the app (instant feedback) and the API (authoritative). Invalid → rejected, "Add without VIN" offered.
- VIN capture: typing/pasting or camera scan via native OCR; OCR text goes through the same validator.
- Decoding goes through our API, which proxies vPIC and keeps a shared per-VIN cache. The app persists vehicle data in MMKV and refreshes it from our API at most once a day.
- Decoded fields are copied onto the vehicle and are editable before and after saving; nothing re-decodes over Owner edits.
- VIN is unique per Owner, not globally. Max 20 vehicles per Owner.

## Consequences

- vPIC traffic is bounded by distinct VINs, not app opens.
- Global uniqueness is rejected: a sold car must be registrable by its new owner, and a global check would leak that a VIN exists elsewhere.
- Native OCR requires a dev build / native module (see VIN camera scanning approach ticket).
