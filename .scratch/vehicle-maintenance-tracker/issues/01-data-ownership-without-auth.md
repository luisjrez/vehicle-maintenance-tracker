# Data ownership without authentication

Type: grilling
Status: resolved
Blocked by:

## Question

With no login, how does the API know whose vehicles and records it is serving? (e.g. anonymous per-install ID generated on device, device-generated secret sent as a header, purely local data with API as backup, …) What happens on reinstall or a new phone, and what are the privacy implications of VINs stored server-side?

## Answer

Resolved 2026-10-26 (grilling with the user). Recorded as [ADR-0001](../../../docs/adr/0001-device-identity-without-auth.md); terms in [CONTEXT.md](../../../CONTEXT.md).

**Identity**
- No login. Every request carries an `X-Device-Id` header.
- Android: `ANDROID_ID` via `expo-application` `getAndroidId()` — scoped to signing key + user + device, survives reinstall, changes on factory reset or signing-key change.
- iOS: random UUID generated on first launch, stored in Keychain via `expo-secure-store`; Keychain survives uninstall (undocumented by Apple, long-standing behavior). `identifierForVendor` rejected (resets when all vendor apps are deleted); fingerprinting rejected (App Store privacy rules).
- API stores only a hash of the Device ID; the raw value is never logged nor shown in the UI.

**Model**
- **Owner** (internal id) owns vehicles and service records. **Device** (Device ID hash) belongs to one Owner. One active Device per Owner.
- Owner + Device are created implicitly the first time the API sees an unknown Device ID (no registration step).

**Device transfer via QR — in v1**
- Old phone: Settings → Transfer to another phone shows a QR holding a **transfer code** (never the Device ID): single-use, expires in 10 min, generating a new one invalidates the previous.
- New phone scans it; API re-points the new Device to the code's Owner and **revokes the old Device** (move, not link). The old phone, if reopened, starts with an empty garage.
- If the new phone already has data: warn, and on confirmation delete its Owner's data and replace it.

**Accepted risks**
- Changing phones without the old one at hand (lost/broken) loses the data.
- The Device ID is a bearer credential: whoever knows it can read that Owner's data.
