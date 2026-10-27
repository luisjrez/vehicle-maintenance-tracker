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
  /** VIN decodes per Device; keeps the API from becoming a free vPIC relay. */
  THROTTLE_VIN_LIMIT: positiveInt.default(30),
  THROTTLE_VIN_TTL_MS: positiveInt.default(3_600_000),
  /** New Owners per client IP: stops minting Device IDs to farm Owners (ADR-0009). */
  THROTTLE_NEW_OWNERS_LIMIT: positiveInt.default(10),
  THROTTLE_NEW_OWNERS_TTL_MS: positiveInt.default(3_600_000),
  /** Proxies in front of the API (the PaaS load balancer); needed to see the real client IP. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  VPIC_BASE_URL: z.url().default('https://vpic.nhtsa.dot.gov/api'),
  VPIC_TIMEOUT_MS: positiveInt.default(5_000),
});

export type Env = z.infer<typeof envSchema>;

/** Parses the process environment once at boot so a misconfiguration fails fast. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
