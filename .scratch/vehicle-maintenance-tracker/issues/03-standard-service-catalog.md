# Standard service catalog

Type: research
Status: resolved
Blocked by:

## Question

What standard list of services can be performed on a vehicle, grouped into categories (preventive maintenance, brakes, tires, suspension, engine, transmission, electrical, A/C, body & paint, detailing, glass, paperwork…)? Catalog is in English for the US market (see Market, language, currency and units). Survey US dealer service menus (several OEMs) and independent shops; produce a draft catalog as a linked markdown asset, noting which items typically carry a recommended interval.

## Answer

Resolved 2026-10-26 (web research). Full catalog, sources and methodology: [service-catalog.md](../research/service-catalog.md).

- **No US standard exists.** OEMs publish model-specific schedules and sell *packages* (Honda Maintenance Minder A/B + sub-items 1–7, Toyota 5,000-mile visits, GM/Ford oil-life-monitor visits, generic "30k/60k/90k service"). Chains converge on about 10 menu categories (Jiffy Lube: Oil Change, Battery, Brakes, Engine, Exterior & Glass, Filters, Fluids, Inspections, Suspension, Tires).
- **Draft catalog:** 14 categories, 117 services, each with a stable kebab-case slug, an English display name and a short description: Routine Maintenance, Brakes, Tires & Wheels, Suspension & Steering, Engine & Exhaust, Transmission & Drivetrain, Cooling System, Electrical & Battery, Heating & A/C, Body & Paint, Glass, Detailing & Appearance, Inspections & Registration, Other (with a `custom` escape hatch).
- **Intervals:** 37 services carry a typical US interval range (e.g. oil 5k–10k mi / 6–12 mo, rotation 5k–7.5k mi, brake fluid 2–3 yr, battery 3–5 yr). These are indicative only; OEM schedules vary and are not available from NHTSA vPIC.
- **Gaps:** the catalog is gas-centric (no EV/diesel-specific items) and excludes non-service costs (fuel, insurance), except registration.

Open questions for the human (not decided; details in the asset):
1. Catalog storage: static code constant vs DB-seeded table vs both.
2. One logged visit = one service, or many services (line items)? Cost per line or per visit? *(Candidate for its own ticket: it shapes the core domain model.)*
3. Packages: single "scheduled maintenance" item with a code, decomposition into services, package templates, or a separate concept.
4. Intervals in v1: none, editable generic defaults, or Owner-entered per vehicle (ties to reminders).
5. Custom services: one-off free text vs reusable Owner-defined types.
6. Variants (axle, oil type, tire count, parts brand) as attributes, separate services or notes.
7. Non-service costs (fuel, insurance, registration, tolls) in scope? *(Candidate for its own scoping ticket.)*
8. Powertrain-aware catalog (gas/diesel/hybrid/EV via vPIC fuel type) vs one flat list.
9. Slug evolution policy (rename/retire; snapshot display names on records?).
10. Fixed vs Owner-changeable categories; multi-category services (affects cost-by-category reports).
11. Record the provider (dealer/chain/independent/DIY)?
12. "Common" quick-pick list in the picker.
