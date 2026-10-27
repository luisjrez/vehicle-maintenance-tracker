# Service catalog decisions

Type: grilling
Status: resolved
Blocked by:

## Question

Decide how the draft catalog from [Standard service catalog](03-standard-service-catalog.md) ([service-catalog.md](../research/service-catalog.md)) is used in v1: keep all 14 categories / 117 services or trim; storage (code constant vs DB-seeded table vs both); how dealer packages (Maintenance Minder, "30k service") are represented; intervals in v1 (none / editable defaults / Owner-entered); powertrain-aware catalog (gas/diesel/hybrid/EV) vs flat list; slug rename/retire policy; fixed vs Owner-changeable categories; a "common services" quick-pick; and whether non-service costs (fuel, insurance, tolls) are in scope at all.

## Answer

Resolved 2026-10-26 (user accepted all recommendations). Recorded as [ADR-0004](../../../docs/adr/0004-service-catalog.md).

1. **Keep the full draft** (14 categories, 117 services); the picker has search, so length is not a problem.
2. **Storage:** catalog defined as a typed constant in `packages/shared` (versioned in git); the API seeds it into a DB table so every record references a valid service; the app reads it from the bundle (no network).
3. **Packages:** no package concept in v1. A "Scheduled maintenance" service with an optional package-code field (e.g. "Honda A1", "30k service"); the individual services performed can be added to the same record.
4. **Intervals/reminders: out of v1.** Typical intervals stay in the catalog data for the future; v1 is logging + viewing.
5. **Single flat list**, plus a handful of EV/hybrid items (high-voltage system inspection, battery coolant service, etc.). No fuel-type filtering in v1.
6. **Slugs are immutable.** Retired services get a `retired` flag: hidden from the picker, existing records keep working.
7. **Categories are fixed;** each service belongs to exactly one category.
8. **Quick-pick of ~8 common services** (oil change, tire rotation, brakes, battery, new tires, wash/detailing, inspection, wiper blades) above search + categories.
9. **Non-service costs (fuel, insurance, tolls) out of scope;** registration stays as a catalog service.
