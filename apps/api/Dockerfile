# Build context is the repo root: the API depends on packages/shared.
# No BuildKit-only syntax (e.g. RUN --mount) so it also builds on the legacy builder.

# --- deps: every workspace manifest is needed for the lockfile to stay frozen ---
FROM oven/bun:1.4.4 AS deps
WORKDIR /repo
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --filter @vmt/api --filter @vmt/shared

# --- build: shared package, Prisma client, Nest app ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN bun run --filter @vmt/shared build && bun run --filter @vmt/api build

# --- prod-deps: runtime dependencies only ---
FROM oven/bun:1.4.4 AS prod-deps
WORKDIR /repo
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production --filter @vmt/api

# --- migrate: one-off job that applies migrations and seeds the catalog ---
FROM node:24-slim AS migrate
WORKDIR /repo
COPY --from=deps /repo/node_modules node_modules
COPY --from=deps /repo/apps/api/node_modules apps/api/node_modules
COPY --from=build /repo/packages/shared packages/shared
COPY --from=build /repo/apps/api/package.json /repo/apps/api/prisma.config.ts apps/api/
COPY --from=build /repo/apps/api/prisma apps/api/prisma
COPY --from=build /repo/apps/api/dist apps/api/dist
WORKDIR /repo/apps/api
# Bun skips dependency lifecycle scripts, so the schema engine is fetched here,
# at build time, instead of on first run (when the filesystem is not writable).
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && node_modules/.bin/prisma version
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# --- runtime: Node 24, no Prisma CLI, non-root ---
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=prod-deps /repo/node_modules node_modules
COPY --from=prod-deps /repo/apps/api/node_modules apps/api/node_modules
COPY --from=prod-deps /repo/packages/shared/node_modules packages/shared/node_modules
COPY --from=build /repo/packages/shared/package.json packages/shared/
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/package.json apps/api/
COPY --from=build /repo/apps/api/dist apps/api/dist
WORKDIR /repo/apps/api
USER node
EXPOSE 3020
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT ?? 3020) + '/v1/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/main.js"]
