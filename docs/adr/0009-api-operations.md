# ADR-0009: Operating an unauthenticated API

Status: accepted (2026-10-26)

## Decision

- `@nestjs/throttler` limits keyed by Device ID and IP: general per-Device rate, a cap on new Owners per IP per hour, a tighter cap on VIN decode per Device, 100 KB body limit.
- Deploy the API image + managed Postgres on a Docker-friendly PaaS (Railway or Fly.io); environments: local and production.
- Mobile: local dev builds; EAS Build for TestFlight/Android internal; no public store release in v1.
- CI on GitHub Actions: oxlint, typecheck, Vitest with Postgres, jest-expo, Docker build.
- Versions stay on the exact pins of ADR-0005; upgrades are out of scope.

## Consequences

- Minting Device IDs to farm Owners or relay vPIC is bounded per IP.
- No staging: production is the only shared environment.
