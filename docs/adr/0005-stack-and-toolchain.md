# ADR-0005: Stack and toolchain

Status: accepted (2026-10-26)

## Context

User-fixed choices: Expo, Bun, NestJS, Docker, Postgres, Prisma. Versions verified on 2026-10-26 (`.scratch/vehicle-maintenance-tracker/research/stack-and-repo-shape.md`).

## Decision

- Bun workspaces monorepo: `apps/mobile`, `apps/api`, `packages/shared` (ESM, framework-free: VIN validation, catalog, Zod 4 schemas). Bun isolated installs.
- Expo SDK 58 (RN 0.88, React 19.3) with dev builds; NestJS 12.2 on **Node 24**; Bun is package manager only.
- Prisma **7.10.1** exact-pinned with `@prisma/adapter-pg`; PostgreSQL 18; TypeScript `~6.0.3` everywhere.
- App↔API contract: Zod schemas from `packages/shared`, validated in NestJS via Standard Schema.
- Tests: Vitest (API), jest-expo (mobile). Lint: oxlint only.
- Docker: multi-stage API image (build with Bun, run on `node:24-slim`); dev compose with Postgres 18 + one-off migrate service; separate test compose with its own Postgres.

## Consequences

- Prisma 8, Node 26 and TypeScript 7 are deliberate later upgrades, not drift.
- One schema source keeps app and API validation identical.
