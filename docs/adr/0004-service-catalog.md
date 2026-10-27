# ADR-0004: Service catalog as shared code, seeded into the database

Status: accepted (2026-10-26)

## Context

There is no US-standard list of vehicle services. Research produced a draft of 14 categories / 117 services with stable slugs and indicative intervals (`.scratch/vehicle-maintenance-tracker/research/service-catalog.md`).

## Decision

- The catalog is a typed constant in `packages/shared`; the API seeds it into a table for referential integrity; the app reads it from its bundle.
- Slugs are immutable; services are retired with a flag, never deleted or renamed in place.
- Fixed categories, one category per service; a flat list (plus a few EV/hybrid items) with search and a quick-pick of common services.
- Dealer packages are not modeled: a "Scheduled maintenance" service carries an optional package code.
- Intervals are kept as data but not used in v1 (no reminders). Non-service costs (fuel, insurance, tolls) are out of scope.

## Consequences

- Catalog changes ship with app/API releases; no admin UI.
- Records stay valid forever because slugs never change.
- Reminders can be added later from the interval data already in the catalog.
