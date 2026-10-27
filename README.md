# Vehicle maintenance tracker

Mobile app (Expo) + API (NestJS) for logging what was done to your cars, when, at what mileage and what it cost. Product spec: `.scratch/vehicle-maintenance-tracker/PRD.md`; decisions: `docs/adr/`; glossary: `CONTEXT.md`.

## Layout

| Path | What |
|---|---|
| `apps/api` | NestJS 12 API on Node 24, Prisma 7.10.1 + PostgreSQL 18 |
| `apps/mobile` | Expo SDK 58 app (dev builds) |
| `packages/shared` | Framework-free ESM: Zod schemas, VIN/odometer rules, catalog |

## Prerequisites

Bun 1.4.4 (package manager only), Node 24 (`.nvmrc`), Docker (Colima works; no BuildKit needed).

## Common commands

```sh
bun install
bun run lint          # oxlint, type-aware
bun run typecheck     # builds shared first
bun run test          # unit tests in every workspace

# API integration tests against an isolated Postgres (port 5483)
bun run --filter @vmt/api db:test:up
bun run --filter @vmt/api test:int
bun run --filter @vmt/api db:test:down

# Full local stack: Postgres (5482) -> migrate job -> API (3020)
docker compose up --build
curl localhost:3020/v1/health
```

Day to day you can run only `docker compose up postgres` and the API on the host:

```sh
cp apps/api/.env.example apps/api/.env
bun run --filter @vmt/api migrate:deploy
bun run --filter @vmt/api start:dev
```
