# Stack versions and repo shape

Research for [07 — Stack versions and repo shape](../issues/07-stack-versions-and-repo-shape.md). Checked on **2026-10-26** against npm dist-tags (`npm view <pkg> version dist-tags`), GitHub releases and official docs. Fixed by the user: Expo (React Native) app, Bun as package manager, NestJS API in a Docker image, Postgres, Prisma.

This document **recommends**; the human decides.

## 1. Version pins

| Piece | Latest stable (2026-10-26) | Recommended pin | Notes |
|---|---|---|---|
| Expo SDK | **58** (`expo@58.0.19`, npm `latest`) | `expo@~58.0.19` | SDK 58 released 2026-10-15 as a full release (beta was 2026-09-15). Some sub-features inside it are still beta/alpha/experimental (Expo Modules 2.0, `expo-app-intents`, Rust "Noxcturnal" transformer) — avoid them. Expo Go for SDK 58 was "within a few weeks" at release → plan on a dev build, not Expo Go. |
| React Native | 0.88.0 (2026-10-15) | whatever SDK 58 pins: `0.88.0` | SDK 58 moved RN 0.86 → 0.88. Let `expo install --fix` own it. |
| React | 19.3.1 on npm | `19.3.0` (SDK 58 `bundledNativeModules`) | Do **not** take npm `latest`; take the SDK's pin. |
| NestJS | **12.2.0** (`@nestjs/core`), CLI 12.0.10 | `^12.2.0` | v12.0.0 shipped 2026-08-27. ESM core packages, CJS apps still work via `require(esm)`. Node 20.19+/22.12+. New ESM projects default to **Vitest + oxlint**; Standard Schema validation (Zod etc.) built in. |
| Prisma ORM | **7.10.1** (stable). 8.0.0-rc.27 is a release candidate | `prisma@7.10.1`, `@prisma/client@7.10.1`, `@prisma/adapter-pg@7.10.1` — **exact** | Gotcha: the `prisma` CLI package's npm `latest` tag **already points at 8.0.0-rc.27** (while `@prisma/client` latest is 7.10.1). A bare `bun add -d prisma` installs the RC. Prisma 8 GA was "expected October 2026" but has not shipped. 8 RC lacks `$extends`, JSON filtering, atomic `increment`, most nested writes, isolation levels and `P2002`-style error codes. Prisma 7 gets 18 months of fixes after 8 GA. |
| PostgreSQL | **18** (18.6) | `postgres:18-alpine` (or `18.6-alpine`) | Postgres 19 is at RC, GA targeted 2026-11-19 — not stable yet. |
| Bun | **1.4.4** (2026-10-22) | `packageManager: "bun@1.4.4"` / `oven/bun:1.4.4` | 1.4.0 shipped 2026-08-20. Local machine currently has 1.3.14 → upgrade. |
| Node.js (LTS) | **24** Active LTS (24.22.1). **26** becomes LTS on **2026-10-28** | `node:24-slim` now; move to 26 once it is LTS and the stack is verified on it | Expo SDK 58 needs 22.13+/24.3+/26+. Prisma 8 (later) needs 22.18+/24.11+/26+. Local machine has 22.16 → fine for Expo, but align to 24. |
| TypeScript | npm `latest` is **7.0.2** (Go port) | **`~6.0.3` everywhere** | Evidence it must stay 6.x: Expo SDK 58 template pins `typescript ~6.0.3`; `@nestjs/swagger@12.0.4` peer is `^5.5.0 \|\| ^6.0.0`; `ts-jest` peer is `>=4.3 <7`. TS 7.0 ships no programmatic compiler API (expected 7.1), which `nest build` (tsc path), ts-jest and the Swagger CLI plugin need. Re-evaluate on TS 7.1. |

Supporting pins seen on npm today (use when scaffolding, not decisions): `jest-expo@~58.0.12`, `expo-router@58.0.26`, `@nestjs/swagger@12.0.4`, `zod@4.6.7`, `pg@8.23.1`, `vitest@5.0.5`, `jest@30.5.2`, `@testing-library/react-native@14.1.0`, `oxlint@1.89.0`, `eslint@10.13.0`.

## 2. Repo shape

### Recommended: Bun workspaces monorepo

```
/
├─ package.json          # "workspaces": ["apps/*", "packages/*"], "packageManager": "bun@1.4.4"
├─ bun.lock
├─ bunfig.toml           # linker choice (see below)
├─ docker-compose.yml    # postgres (+ api, optional)
├─ apps/
│  ├─ mobile/            # Expo SDK 58 app (expo-router)
│  └─ api/               # NestJS 12, Prisma 7, Dockerfile
└─ packages/
   └─ shared/            # VIN validation, enums (service categories), Zod schemas / DTO types, money/mileage helpers
```

- Expo officially supports Bun workspaces, auto-configures Metro for monorepos (no `watchFolders` hacks since SDK 52) and recommends exactly the `apps/` + `packages/` layout. Reference internal packages with `"@vmt/shared": "workspace:*"`. ([Expo monorepos guide](https://docs.expo.dev/guides/monorepos/))
- Duplicate `react` / `react-native` / native modules in one app are **not supported** — keep `react` only in `apps/mobile` (shared declares it as a peer, if at all) and check with `bun pm why react-native`. Since SDK 55 autolinking module resolution is automatic in monorepos.

### Isolated vs hoisted installs (Bun)

- Bun makes **isolated** installs the default for **new** workspace projects (lockfile `configVersion = 1`); force hoisted with `[install] linker = "hoisted"` in `bunfig.toml`. ([Bun isolated installs](https://bun.com/docs/pm/isolated-installs))
- Expo supports isolated installs since SDK 54 but warns "not all packages you install will work" (native build / resolution errors in some RN libraries).
- **Recommendation:** start isolated (it prevents the API from silently importing mobile deps and vice versa); if a native build or Metro resolution fails, switch to `linker = "hoisted"` rather than patching. Decide this at scaffold time — switching linkers reinstalls `node_modules` from scratch.

### Shared package (RN + NestJS)

Works if it is **ESM-only and framework-free** (no React, no Nest, no Node built-ins):

- `"type": "module"`, `exports` → built `dist/*.js` + `.d.ts`, built with plain `tsc` (TS 6). Both consumers then import compiled JS.
- Why build instead of shipping `.ts` source: Metro can compile TS from a workspace package, but Node does **not** strip types for files resolved under `node_modules`, and Nest's `tsc` build won't compile code outside its `rootDir`. A build step (`tsc -b` / `tsc --watch` in dev, TS project references) is the low-risk path. A source-only `exports` condition for Metro is an optimization to consider later.
- The API should be an **ESM** Nest project (Nest 12 offers ESM at `nest new`; Prisma 7 itself requires ESM — `"type": "module"`), so ESM shared code is consumed natively. A CJS Nest app would also work via `require(esm)` on Node 22.12+/24.
- Validation: Zod 4 implements Standard Schema, which Nest 12 consumes natively (`@Body({ schema })` + `StandardSchemaValidationPipe`) and RN can run as-is → one schema for form validation (mobile) and request validation (API). Prisma types must **not** leak into `shared` (generated client is server-only).

## 3. API runtime: Node vs Bun

| | Node 24 LTS (recommended) | Bun 1.4 runtime |
|---|---|---|
| NestJS 12 | Officially supported; docs/release notes target Node and recommend the latest active LTS | Bun is listed only as a **package manager** in Nest 12's CLI. Bun has supported `emitDecoratorMetadata` since 1.0.3 so Nest generally runs, but there is no official support statement for Nest 12 on Bun. |
| Prisma 7 | Fully supported | Supported — Prisma has a [v7 Bun runtime guide](https://www.prisma.io/docs/guides/v7/runtimes/bun) with `@prisma/adapter-pg`; CLI must be run with `bunx --bun prisma …` or it falls back to Node via the shebang. |
| Tooling (Vitest/Jest, Swagger plugin, `nest build`, APM agents) | Native | Partial; APM agents commonly don't support Bun. |
| Docker | `node:24-slim` | `oven/bun:1.4.4-slim` / distroless |

**Recommendation: Bun as package manager + script runner, Node 24 as the API runtime** (in dev and in the image). Bun runtime saves little for a small CRUD API and adds an unofficial path for Nest. Revisit only if Nest documents Bun runtime support.

### Prisma 7 gotchas with Bun / monorepo

- New generator `provider = "prisma-client"` with a **required** `output` (no more `node_modules/.prisma`) → generate into `apps/api/src/generated/prisma` (gitignored) and import from there.
- **Driver adapter is mandatory** for Postgres: `@prisma/adapter-pg` + `pg`, passed as `new PrismaClient({ adapter })`.
- `prisma.config.ts` holds schema path, migrations path and datasource URL; **`.env` is not loaded automatically by the CLI** in v7 (load via `dotenv`, or rely on Bun, which auto-loads `.env` when the CLI runs under `bunx --bun`).
- `migrate dev` / `db push` **no longer run `generate`** → add explicit `prisma generate` to the API's `build`, `test` and a root `postinstall`-style script. Bun does not run dependency lifecycle scripts unless trusted (`trustedDependencies`), so don't rely on package `postinstall` hooks — call generate from your own scripts.
- Pin `prisma` exactly (`7.10.1`) because its npm `latest` is the 8 RC.
- Rust-free client in 7 → no `binaryTargets` juggling for Alpine/ARM images.
- Sources: [Prisma 7 upgrade guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Prisma ORM v7 docs](https://www.prisma.io/docs/orm/v7), [Release status](https://www.prisma.io/docs/orm/release-status).

## 4. Docker

### API image (multi-stage, sketch — not code to commit yet)

1. **deps** — `oven/bun:1.4.4`: copy root `package.json`, `bun.lock`, `bunfig.toml` and every workspace `package.json` (lockfile needs all of them), `bun install --frozen-lockfile` (optionally filtered to the API + shared).
2. **build** — copy `packages/shared` + `apps/api`, `bun run --filter @vmt/shared build`, `prisma generate`, `nest build`.
3. **runtime** — `node:24-slim` (Debian; Alpine works too now that Prisma 7 is Rust-free, but slim avoids musl surprises with `pg`/other natives). Copy `dist`, production `node_modules`, the generated client, `prisma/` (schema + migrations) and `prisma.config.ts`. Run as non-root `node` user, `CMD ["node", "dist/main.js"]`, healthcheck endpoint.

Build context must be the **repo root** (the API depends on `packages/shared`); add a root `.dockerignore` excluding `apps/mobile`, `**/node_modules`, `.expo`, `*.tsbuildinfo`.

### Migrations in containers

Options (recommend **A** for local + simple deploys):

- **A. One-off migrate service/job** using the build stage (has the Prisma CLI): `prisma migrate deploy`, `depends_on: postgres (service_healthy)`, and the `api` service `depends_on: migrate (service_completed_successfully)`. Keeps the runtime image free of the CLI.
- **B. Entrypoint** `prisma migrate deploy && node dist/main.js` — simplest, but needs the CLI in the runtime image and races if >1 replica starts.
- **C.** Run `migrate deploy` from CI before rollout — depends on the deployment target (still open on the map).

`migrate dev` stays a developer-machine command against the compose Postgres.

### docker-compose (local dev)

- `postgres:18-alpine` with `POSTGRES_USER/PASSWORD/DB`, a named volume, `pg_isready` healthcheck, and a **non-default host port** (other local projects already use 54xx ports — pick a free one, e.g. 5482).
- **Postgres 18 image gotcha:** the image now uses `PGDATA=/var/lib/postgresql/18/docker` and expects the volume at **`/var/lib/postgresql`** (not `/var/lib/postgresql/data` as in ≤17 tutorials).
- Day-to-day: run only Postgres in compose and the API on the host (`nest start --watch` under Node 24) for fast reloads; the `api` + `migrate` services exist to verify the image.
- Colima note (from this machine's history): no buildx/BuildKit by default — keep the Dockerfile free of BuildKit-only syntax (`--mount=type=cache`) or install buildx.

## 5. Testing and lint — options only

**API (NestJS 12):**
- **Vitest 5** — Nest 12's default for new ESM projects; native ESM; works with Nest's DI using SWC/`unplugin-swc` for decorator metadata. Natural fit with an ESM API + Prisma 7.
- **Jest 30 + ts-jest** — Nest's default for CJS projects; ESM support is still awkward; ts-jest caps TS `<7`.
- **`bun test`** — fast, but runs on the Bun runtime (contradicts a Node runtime choice) and decorator-metadata/Nest testing module edge cases are on you.
- e2e: Supertest against the Nest app + a real Postgres (compose or Testcontainers).

**Mobile (Expo 58):**
- **jest-expo `~58.0.12` + React Native Testing Library 14** — the supported path (RNTL 14 needs `await render`). Vitest isn't a supported RN runner.
- E2E (later): Maestro or similar — out of this ticket's scope.

**Lint/format:**
- **oxlint 1.89** — Nest 12 generates it by default; very fast; type-aware rules via `oxlint-tsgolint`. Config file must be `.oxlintrc.json`.
- **ESLint** — `eslint-config-expo` is the Expo path; check its ESLint major support (ESLint 10 is npm latest; on SDK 57 the Expo config needed ESLint 9).
- Options: oxlint repo-wide; or oxlint for API/shared + ESLint (expo config) for mobile. Formatter: Prettier or oxfmt/Biome.

## 6. Risks

1. **Prisma 8 GA lands during implementation.** Starting on 7.10.1 means a later major upgrade (8 changes packages to `@prisma/orm-postgres`). Mitigated by the 18-month support window. Starting on the RC risks API churn and missing features (`P2002` codes matter for unique constraints such as one VIN per Owner).
2. **Bun isolated installs + RN native libraries** may produce native build or Metro resolution failures → fallback is the hoisted linker.
3. **TypeScript 7 pressure** — tools/scaffolders may pull TS 7 (npm `latest`). Pin `typescript@~6.0.3` at the root and enforce one version.
4. **Expo Go lagging SDK 58** → development builds (`expo-dev-client`) from day one, which implies Xcode/Android Studio locally or EAS Build.
5. **Node 26 LTS in two days** — fine to start on 24; bumping later is low-risk but should be one coordinated change (local `.nvmrc`/`engines`, Docker base, CI).
6. **Docker build context = repo root** makes images slower/bigger if `.dockerignore` is sloppy.

## 7. Open questions for the human

1. **Prisma 7.10.1 (stable, recommended) or wait for / start on Prisma 8?** Suggest: 7.10.1 now; re-check at implementation kickoff and only switch if 8 is GA *and* the missing features aren't needed.
2. **API runtime: Node 24 (recommended) or Bun?**
3. **Node 24 now, or wait two days and standardize on Node 26 LTS?**
4. **Bun linker: isolated (recommended first try) or hoisted from the start** (less friction with RN)?
5. **Validation library in `shared`:** Zod 4 (Standard Schema → Nest 12 native) vs class-validator DTOs on the API only.
6. **Test runner for the API:** Vitest (Nest 12 ESM default) vs Jest.
7. **Lint:** oxlint everywhere vs oxlint + ESLint for mobile.
8. **Migrations in containers:** one-off `migrate` service (recommended) vs entrypoint.

## 8. Newly surfaced questions (may deserve their own tickets)

- **Mobile build/distribution path:** dev builds locally vs EAS Build; iOS/Android targets for v1; EAS cost. Tied to the map's "API deployment target and environments".
- **Shared package contract:** what exactly lives in `packages/shared` (VIN validation, service catalog enums, API request/response schemas) vs generated OpenAPI client for mobile (`@nestjs/swagger` → typed client) — pick one source of truth for the API contract.
- **CI:** where it runs (GitHub Actions?), what it gates (typecheck, lint, tests, Docker build, migration check).
- **Versioning policy:** exact pins vs `~` ranges, and who owns upgrades (Prisma 8 GA, Node 26, TS 7.1).

## Sources

- npm registry, `npm view <pkg> version dist-tags` (2026-10-26): `expo`, `react-native`, `react`, `@nestjs/core`, `@nestjs/cli`, `@nestjs/swagger`, `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `typescript`, `ts-jest`, `bun`, `jest-expo`, `vitest`, `oxlint`, `expo-template-default@sdk-58`
- Expo SDK 58 release: https://expo.dev/changelog/sdk-58 · changelog index: https://expo.dev/changelog
- Expo SDK 58 bundled versions: https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json
- Expo monorepos guide: https://docs.expo.dev/guides/monorepos/
- NestJS v12.0.0 release notes: https://github.com/nestjs/nest/releases/tag/v12.0.0 · migration guide: https://docs.nestjs.com/migration-guide
- NestJS Swagger CLI plugin: https://docs.nestjs.com/openapi/cli-plugin
- Prisma release status: https://www.prisma.io/docs/orm/release-status
- Prisma 7 upgrade guide: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- Prisma ORM v7 docs: https://www.prisma.io/docs/orm/v7
- Prisma v7 Bun runtime guide: https://www.prisma.io/docs/guides/v7/runtimes/bun
- Prisma 8 introduction: https://www.prisma.io/docs/v8
- Bun releases: https://github.com/oven-sh/bun/releases · Bun 1.4: https://bun.com/1.4
- Bun isolated installs: https://bun.com/docs/pm/isolated-installs
- Bun `emitDecoratorMetadata` support (1.0.3): https://bun.sh/blog/bun-v1.0.3
- Node.js release lifecycle: https://endoflife.date/nodejs
- PostgreSQL lifecycle: https://endoflife.date/postgresql · Postgres 19 Beta 1: https://www.postgresql.org/about/news/postgresql-19-beta-1-released-3313/
- Docker Hub tags: https://hub.docker.com/_/postgres · https://hub.docker.com/_/node · https://hub.docker.com/r/oven/bun
- TypeScript 7 lacks compiler API (secondary): https://www.syncfusion.com/blogs/post/typescript-7-upgrade-guide.md · https://www.itwriting.com/blog/?p=12438
