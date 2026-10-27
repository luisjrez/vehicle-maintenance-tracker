import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3020),
});

export type Env = z.infer<typeof envSchema>;

/** Parses the process environment once at boot so a misconfiguration fails fast. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
