# ADR-0001: Device identity instead of authentication

Status: accepted (2026-10-26)

## Context

The app has no login, yet the API is the source of truth for vehicles and service records. Each request must be scoped to whoever owns the data, and data should survive an app reinstall.

## Decision

- Each install sends an opaque **Device ID** in `X-Device-Id`: `ANDROID_ID` on Android; on iOS a random UUID persisted in the Keychain (`expo-secure-store`).
- The API stores only a hash of it. Data belongs to an **Owner**; a **Device** belongs to an Owner (one active Device per Owner). Both are created implicitly on first sight of an unknown Device ID.
- Moving to a new phone uses a single-use, 10-minute **transfer code** shown as a QR on the old phone. Redeeming it moves the Owner to the new Device and revokes the old one; existing data on the new Device is replaced after confirmation.

## Consequences

- No accounts to build; Owner/Device separation lets accounts or multi-device be added later without migrating data tables.
- The Device ID is a bearer credential — never log or display it.
- Losing the old phone means losing the data. iOS reinstall survival relies on undocumented Keychain behavior.
- Rejected: `identifierForVendor` (resets on reinstall), device fingerprinting (App Store rules), linking both phones after transfer (multi-device conflicts).
