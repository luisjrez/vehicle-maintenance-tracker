# Runbook — production

v1 has two environments: **local** (docker-compose) and **production** (ADR-0009). Production is one API service built from `apps/api/Dockerfile` (default `release` target) plus a managed PostgreSQL 18 on a Docker PaaS. The config here targets **Railway** (`railway.json`); Fly.io works the same way with `release_command` (see the end).

## Secrets and settings

Set these in the platform's variables UI, never in the repo:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The managed Postgres connection string (with `?sslmode=require` if the provider needs it). |
| `DEVICE_ID_HASH_SECRET` | 32+ random characters (`openssl rand -hex 32`). See "Rotate secrets" before ever changing it. |
| `PORT` | Usually injected by the platform; the API listens on it. |
| `TRUST_PROXY_HOPS` | `1` behind the platform's load balancer, so per-IP limits see the real client IP. |
| `THROTTLE_*` | Optional; defaults are 60 req/min per device, 30 VIN decodes/hour per device, 10 new Owners/hour per IP. |

## Deploy

1. Merge to `main` with CI green (lint, typecheck, unit, integration with Postgres, Metro bundle, Docker images).
2. Railway builds `apps/api/Dockerfile` from the repo root. Before switching traffic it runs the **pre-deploy command**: `prisma migrate deploy && node dist/seed.js` (migrations, then the idempotent catalog seed). A failing migration aborts the deploy and the old version keeps serving.
3. The new version must answer `GET /v1/health` (200 only when the database is reachable) before it receives traffic.
4. Smoke test: `curl https://<api-host>/v1/health` → `{"status":"ok","database":"up"}`.

Manual deploy from a laptop: `railway up` (after `railway link` to the project).

### Mobile builds (EAS)

1. Put the production API URL in `apps/mobile/eas.json` (`EXPO_PUBLIC_API_URL`, all profiles).
2. Internal Android/iOS build: `cd apps/mobile && bunx eas-cli build --profile internal --platform all`.
3. TestFlight: `bunx eas-cli build --profile testflight --platform ios` then `bunx eas-cli submit --profile testflight --platform ios --latest`.
4. Install from TestFlight and check Settings → API status says **Connected**.

## Roll back

- **API code:** redeploy the previous successful deployment from the platform's history (Railway: Deployments → ⋯ → Redeploy). Migrations are not reverted automatically.
- **A bad migration:** write a new forward migration that undoes it (`prisma migrate dev --create-only` locally), ship it as a normal deploy. Do not edit applied migrations. If data is at risk, restore the managed database's latest backup into a new instance, point `DATABASE_URL` at it, redeploy.
- **Mobile:** there is no OTA update channel in v1; ship a new EAS build. Old builds keep working as long as the API stays backward compatible.

## Rotate secrets

- **`DATABASE_URL` password:** create the new credential in the database provider, update the variable, redeploy, then revoke the old one.
- **`DEVICE_ID_HASH_SECRET`:** stored Device hashes are keyed with it, so **changing it disconnects every phone from its data** (each phone becomes a new, empty Owner). Only rotate after a leak, and only together with a migration plan (e.g. dual-hash lookups during a window). Treat it like a database master key.
- Device IDs themselves are never logged or stored in clear (ADR-0001), so there is nothing else to rotate.

## Fly.io alternative

`fly launch --dockerfile apps/api/Dockerfile --no-deploy`, then in `fly.toml`:

```toml
[deploy]
  release_command = "sh -c 'node_modules/.bin/prisma migrate deploy && node dist/seed.js'"

[[http_service.checks]]
  path = "/v1/health"
```

Attach Fly Postgres (or another managed Postgres), set the secrets with `fly secrets set`, and `fly deploy`.
