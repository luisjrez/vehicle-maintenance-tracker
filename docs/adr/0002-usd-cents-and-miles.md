# ADR-0002: USD in integer cents, odometer in miles

Status: accepted (2026-10-26)

## Context

v1 targets the US market only, in English. Costs are summed into totals per vehicle, so they must be exact.

## Decision

- Money is stored as integer cents with a `currency` column fixed to `"USD"`; no user-facing currency preference.
- Odometer readings are stored as integer miles; no unit preference.
- Display uses `Intl` with the `en-US` locale.

## Consequences

- Totals are exact integer sums; no floating-point money.
- Opening another market later means adding currencies/units, not migrating existing rows.
- Rejected: per-Owner unit/currency preferences and per-record currencies (mixed-currency totals without exchange rates).
