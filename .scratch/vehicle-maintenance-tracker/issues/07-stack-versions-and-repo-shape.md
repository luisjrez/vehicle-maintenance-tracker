# Stack versions and repo shape

Type: research
Status: resolved
Blocked by:

## Question

What are the latest stable versions of Expo SDK, React Native, NestJS, Prisma and Postgres to pin, and how is the repo shaped — Bun workspaces monorepo (apps/mobile, apps/api, shared package?), Docker image for the API + docker-compose with Postgres, NestJS on Bun vs Node runtime, and any known incompatibilities (e.g. Prisma 7 vs 8 RC, NestJS 12 ESM)? Hint: Expo docs already list v58.0.0 — confirm which SDK is the latest stable.

## Answer

_2026-10-26_ — Full research: [stack-and-repo-shape.md](../research/stack-and-repo-shape.md).

**Recommended pins (latest stable, verified on npm and the official docs):**

- **Expo SDK 58** (`expo@~58.0.19`). SDK 58 is stable and was released 2026-10-15.
  - React Native **0.88.0** and React **19.3.0**. Take both from the SDK's pins, not from npm `latest`.
  - Expo Go for SDK 58 is lagging, so plan on dev builds.
- **NestJS 12.2.0.** It ships ESM core packages, needs Node 20.19+ or 22.12+, and supports Standard Schema validation natively.
- **Prisma 7.10.1, pinned exactly.** Pin `prisma`, `@prisma/client` and `@prisma/adapter-pg`.
  - Prisma 8 is still RC (8.0.0-rc.27), but npm `latest` for the `prisma` CLI already points to that RC.
  - The RC lacks nested writes, `P2002` codes, `$extends` and atomic `increment`.
- **PostgreSQL 18** (`postgres:18-alpine`). Postgres 19 is still RC, with GA targeted for 2026-11-19.
- **Bun 1.4.4.**
- **Node 24 LTS.** Node 26 becomes LTS on 2026-10-28.
- **TypeScript `~6.0.3` across the repo.** The Expo 58 template pins it. `@nestjs/swagger` peer is `^5.5 || ^6` and `ts-jest` needs `<7`. TS 7 has no compiler API until 7.1.

**Repo shape:**

- A Bun workspaces monorepo:
  - `apps/mobile` (Expo)
  - `apps/api` (NestJS + Prisma + Dockerfile)
  - `packages/shared` (ESM, built with `tsc`, framework-free: VIN validation, enums, Zod 4 schemas)
- Expo supports Bun workspaces and configures Metro for monorepos automatically.
- Try Bun's default isolated linker first. Fall back to `linker = "hoisted"` if RN native builds or Metro break.

**Runtime and Docker:**

- Use Bun as the package manager and Node 24 as the API runtime. Bun is not an officially supported NestJS runtime.
- The Docker build is multi-stage: Bun install and build, then a `node:24-slim` runtime. The build context is the repo root.
- docker-compose runs Postgres 18. Mount the volume at `/var/lib/postgresql`, which changed in 18.
- Migrations run in a one-off `prisma migrate deploy` service.
- Prisma 7 gotchas:
  - A driver adapter is mandatory.
  - `output` is required.
  - `.env` is not auto-loaded.
  - Run `generate` explicitly.

**Open questions for the human:**

1. Use Prisma 7.10.1 now, or wait for Prisma 8 GA?
2. Run the API on Node or on Bun?
3. Use Node 24 now, or Node 26 LTS?
4. Use Bun's isolated or hoisted linker?
5. Use Zod in `shared`, or class-validator DTOs?
6. Use Vitest or Jest for the API?
7. Use oxlint only, or oxlint plus ESLint on mobile?
8. Run migrations as a separate migrate service or in the entrypoint?

**Newly surfaced questions:**

- Mobile build and distribution: local dev builds vs EAS.
- The source of truth for the API contract: shared schemas vs a generated OpenAPI client.
- CI.
- Version and upgrade policy.
