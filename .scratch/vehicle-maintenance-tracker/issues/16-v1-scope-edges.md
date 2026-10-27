# v1 scope edges: reports, attachments, offline writes

Type: grilling
Status: resolved
Blocked by:

## Question

Now that the domain model is set: (1) cost reporting in v1 — which totals (per vehicle, per year/month, per category, per provider type), charts or numbers only, where they live in the app; (2) receipt/invoice photos — in v1 or not, and if yes storage (Postgres bytea vs object storage vs device-only), limits; (3) offline behavior for writes — online-only with clear errors vs queueing records locally in MMKV and syncing (vehicle data is already cached in MMKV and refreshed daily, see VIN policy decisions).

## Answer

Resolved 2026-10-26 (grilling with the user).

1. **Basic cost reports**, inside each vehicle's detail (no separate tab): lifetime total, current-year total, spend per category (simple horizontal bars), year filter. The garage shows each vehicle's current-year spend. No trend charts in v1.
2. **Receipt/invoice photos: out of v1.** Notes cover the essentials.
3. **Data lives on the server; the app keeps a local copy in a Zustand store** (persisted on device via MMKV, consistent with the VIN policy decision). Every write (create/edit/delete) goes to the API and needs connectivity — clear error + retry, form input preserved. Reads come from the local store, so the garage, vehicles and logs remain viewable offline; refreshed from the API (vehicle data at most daily per VIN policy decisions). No offline write queue.
