# ADR-0008: Server is the source of truth; app mirrors it in a persisted Zustand store

Status: accepted (2026-10-26)

## Decision

- All writes go to the API; they require connectivity and fail with a clear, retryable error that preserves form input.
- The app keeps a local mirror of the Owner's data (vehicles, service records) in a Zustand store persisted with MMKV; reads are served from it, so the app is browsable offline. Vehicle data refreshes from the API at most once a day.
- No offline write queue / sync engine in v1.

## Consequences

- No conflict resolution needed (one active Device per Owner, online writes).
- After a successful write the store is updated from the API response, keeping server and mirror aligned.
- Rejected: local-first with queued writes (sync conflicts, complexity not worth it in v1).
