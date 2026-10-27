# Domain model

Type: grilling
Status: resolved
Blocked by: 01, 03, 08, 09

## Question

What are the core entities and their rules — Vehicle, Service record (one visit with several services/line items?), cost breakdown (parts/labor/total), odometer readings, shop/provider, custom services outside the catalog? Owner/Device are already decided (see ADR-0001) — vehicles and records hang off Owner. Also settle the catalog questions that are really domain questions (see [service-catalog.md](../research/service-catalog.md)): one visit = one service or several line items, cost per line vs per visit; custom services as free text vs reusable Owner-defined types; variants (axle, oil type, tire count) as attributes vs notes; recording the provider (dealer/chain/independent/DIY); snapshotting service display names on records; soft vs hard delete of vehicles and its interaction with per-Owner VIN uniqueness. Record terms in CONTEXT.md and system-wide decisions as ADRs.

## Answer

Resolved 2026-10-26 (grilling with the user). Terms in [CONTEXT.md](../../../CONTEXT.md); odometer rule in [ADR-0007](../../../docs/adr/0007-odometer-consistency.md).

**Service record = one visit with line items**
- Service record: date (date only, not in the future), odometer (optional), provider name (optional free text) + provider type (optional: Dealer / Chain / Independent shop / DIY), notes (optional), **total paid (required, integer cents, `$0` allowed)**, `currency = "USD"`.
- Line item (≥1 per record): a catalog service slug **or** a custom name (free text; the app suggests the Owner's previously used custom names), optional cost (cents), optional notes (variants like axle, oil type, tire count go here). No parts/labor/tax split in v1.
- Cost reports use line-item costs where present; the record total is the source of truth for spend.

**Vehicle**
- Required: make, model, year (from VIN decode or manual); **initial odometer (required)** captured at creation, typed or scanned, stamped with the creation date.
- Optional: VIN, trim + other decoded details (all editable), nickname (fallback display "2019 Honda Civic"), license plate + state, color. No photo in v1.
- **Current mileage is derived**: max(initial odometer, record odometers). Not stored.

**Odometer consistency (by date)**
- Records may have any date, including before the vehicle was added (backfilling old invoices in any order).
- A record's odometer must be ≥ the highest reading dated before it and ≤ the lowest reading dated after it; equal is allowed. The initial odometer counts as a reading at the creation date. Records without odometer are skipped. **Violations are rejected** (app and API apply the same rule from `packages/shared`).

**Lifecycle**
- Everything on a record is editable under the same validations.
- Deleting a record or a vehicle is a **hard delete** with confirmation (vehicle delete cascades to its records and shows how many will be lost). Re-adding the same VIN afterwards just works.
