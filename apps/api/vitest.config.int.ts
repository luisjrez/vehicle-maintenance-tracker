import { defineConfig } from 'vitest/config';

// Integration tests run against the Postgres from docker-compose.test.yml.
// They share one database, so files run one after another.
export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.int-spec.ts'],
    globalSetup: ['test/global-setup.ts'],
    setupFiles: ['test/load-test-env.ts'],
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
