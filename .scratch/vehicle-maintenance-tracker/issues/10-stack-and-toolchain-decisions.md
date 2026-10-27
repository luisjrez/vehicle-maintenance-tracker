# Stack and toolchain decisions

Type: grilling
Status: resolved
Blocked by:

## Question

Decide the open questions from [Stack versions and repo shape](07-stack-versions-and-repo-shape.md) ([stack-and-repo-shape.md](../research/stack-and-repo-shape.md)): Prisma 7.10.1 now vs wait for 8 GA; API runtime Node 24 vs Bun; Node 24 vs 26 LTS; Bun isolated vs hoisted installs; API contract (Zod schemas in `packages/shared` vs class-validator DTOs / OpenAPI-generated client); Vitest vs Jest for the API; oxlint only vs oxlint + ESLint on mobile; migrations as a one-off compose service vs container entrypoint.

## Answer

Resolved 2026-10-26 (grilling with the user). Recorded as [ADR-0005](../../../docs/adr/0005-stack-and-toolchain.md).

1. **Prisma 7.10.1**, exact pins for `prisma`, `@prisma/client`, `@prisma/adapter-pg` (plain `bun add prisma` would pull the 8.x RC).
2. **Bun is only the package manager**; the API runs on **Node 24**.
3. **Node 24 LTS** (move to 26 once Prisma 7 / NestJS 12 confirm support).
4. **Bun isolated installs** (default); fall back to hoisted only if RN native builds break.
5. **API contract: Zod 4 schemas in `packages/shared`**, validated by NestJS 12 via Standard Schema; no OpenAPI-generated client.
6. **Tests: Vitest for the API, jest-expo for mobile.**
7. **Lint: oxlint only** across the monorepo (type-aware via `oxlint-tsgolint`).
8. **Docker:** migrations run as a one-off `prisma migrate deploy` compose service before the API starts; a **separate docker-compose for tests** with its own Postgres (isolated from dev data).
