import { existsSync } from 'node:fs';

// CI provides DATABASE_URL directly; locally it comes from .env.test.
if (process.env.DATABASE_URL === undefined && existsSync('.env.test')) {
  process.loadEnvFile('.env.test');
}
