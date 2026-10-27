# ADR-0007: Odometer consistency is validated by date and rejected on violation

Status: accepted (2026-10-26)

## Context

Owners backfill old invoices after adding a vehicle, in any order. The log must never show mileage going backwards in time.

## Decision

- Each vehicle has a required initial odometer, treated as a reading on its creation date.
- A service record's (optional) odometer must be ≥ the highest reading dated before it and ≤ the lowest reading dated after it; equal values are allowed (same-day work is one record anyway).
- Violations are rejected, not warned. The rule lives in `packages/shared` and runs in both app and API.
- Current mileage is derived (max of all readings), never stored.

## Consequences

- Backfilling in any order works; a typo that breaks monotonicity must be fixed before saving.
- Editing a record's date or odometer re-runs the same check against its neighbours.
- Rejected: "only after the latest record" (blocks forgotten old invoices) and warn-only (allows an incoherent log).
