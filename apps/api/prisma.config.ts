import { defineConfig } from 'prisma/config';

// Prisma 7 does not load .env on its own; the CLI reads DATABASE_URL from the
// process environment (docker-compose, CI, or `node --env-file`). It is read
// lazily (not with `env()`) so `prisma generate` works without a database.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
