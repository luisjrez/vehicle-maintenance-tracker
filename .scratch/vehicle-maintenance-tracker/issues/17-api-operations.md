# API operations: abuse protection, deployment, builds and CI

Type: grilling
Status: resolved
Blocked by:

## Question

For an unauthenticated API: rate limiting (per Device ID / per IP), keeping the VIN decode endpoint from becoming a free vPIC relay, payload limits. Where the API + Postgres are deployed for v1 (and environments: local / staging / prod), how the mobile app is built and distributed (local dev builds vs EAS Build; Expo Go for SDK 58 not available), CI (where it runs, what it checks — lint, typecheck, Vitest, jest-expo, Docker build), and the version/upgrade policy (exact pins; Prisma 8, Node 26, TS 7 later).

## Answer

Resolved 2026-10-26 (grilling with the user). Recorded as [ADR-0009](../../../docs/adr/0009-api-operations.md).

1. **Abuse protection** with `@nestjs/throttler`, keyed by Device ID and by IP: ~60 req/min per Device; **max 10 new Owners per hour per IP** (stops minting Device IDs); VIN decode ~30/hour per Device; request bodies ≤ 100 KB. (Exact numbers tunable in implementation.)
2. **Deployment:** Docker-friendly PaaS with managed Postgres (Railway or Fly.io — final pick at deploy time; nothing in the spec depends on it). Environments: **local** (docker-compose) and **production** only; no staging in v1.
3. **Mobile builds:** local dev builds (`expo run:ios` / `run:android`) for development; **EAS Build** for TestFlight + Android internal distribution. Public store release is out of v1.
4. **CI: GitHub Actions** — oxlint, typecheck, Vitest (Postgres service container), jest-expo, Docker image build. EAS builds triggered manually. (The project is not a git repo yet; initializing it is an implementation step.)
5. **Versions:** stay on the exact pins fixed in [ADR-0005](../../../docs/adr/0005-stack-and-toolchain.md). No upgrade plan or bots in scope.
