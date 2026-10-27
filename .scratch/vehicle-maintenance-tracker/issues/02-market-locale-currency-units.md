# Market, language, currency and units

Type: grilling
Status: resolved
Blocked by:

## Question

Which market does v1 target (Mexico? US? both)? What UI language(s), currency (single fixed vs per-record), distance unit (km/mi) and date formats?

## Answer

Resolved 2026-10-26 (grilling with the user). Money storage recorded as [ADR-0002](../../../docs/adr/0002-usd-cents-and-miles.md).

- **Market (v1):** United States. Assume US-market vehicles.
- **Language:** English everywhere — UI copy, service catalog, API error messages, code, docs.
- **Currency:** fixed USD. Amounts stored as integer cents; every record also stores `currency = "USD"` so another market needs no migration. No currency preference.
- **Distance:** fixed miles; odometer stored as an integer in miles. No unit preference.
- **Formatting:** dates and amounts via `Intl` with `en-US` (`10/26/2026`, `$1,234.56`).
- **i18n:** no i18n library in v1; UI strings centralized so they can be translated later.
