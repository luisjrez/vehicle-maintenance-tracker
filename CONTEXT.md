# Vehicle maintenance tracker — domain glossary

System-wide terms shared by the mobile app and the API.

- **Owner** — the anonymous holder of vehicles and service records. Internal id only; there are no user accounts. Avoid: user, account, customer.
- **Device** — an app install acting on behalf of an Owner, identified server-side by the hash of its Device ID. One active Device per Owner.
- **Device ID** — opaque credential the app sends in `X-Device-Id` (`ANDROID_ID` on Android, Keychain-stored UUID on iOS). Secret: never logged or displayed.
- **Transfer code** — single-use, short-lived (10 min) code shown as a QR on the old phone; redeeming it moves the Owner to the new Device and revokes the old one.
- **Vehicle** — a car belonging to an Owner: make/model/year (decoded from the VIN or entered manually), optional VIN (unique per Owner only), nickname, plate/state, color, and a required **initial odometer**. Max 20 per Owner.
- **Current mileage** — derived: the highest of the initial odometer and all record odometers. Never stored.
- **Service record** — one visit/job on a date: optional odometer, optional provider (name + type: Dealer, Chain, Independent shop, DIY), notes, and a required **total paid**. Avoid: log entry, maintenance (as a noun for the record).
- **Line item** — one service performed within a service record: a catalog service or a custom name, with optional cost and notes.
- **Catalog service** — an entry of the fixed service catalog, identified by an immutable slug, belonging to exactly one **category**; may be `retired`.
- **Custom service** — a line item named by the Owner in free text instead of a catalog service.
- **Odometer consistency** — readings never decrease as dates advance (see ADR-0007).
