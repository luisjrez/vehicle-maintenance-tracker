import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: positiveInt.default(3020),
  /** Key for hashing Device IDs. Changing it orphans every Owner. */
  DEVICE_ID_HASH_SECRET: z.string().min(32),
  /** General per-Device rate limit (ADR-0009). Tunable so tests can lower it. */
  THROTTLE_DEVICE_LIMIT: positiveInt.default(60),
  THROTTLE_DEVICE_TTL_MS: positiveInt.default(60_000),
});

export type Env = z.infer<typeof envSchema>;

/** Parses the process environment once at boot so a misconfiguration fails fast. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
