import { z } from 'zod';

export const API_VERSION = 'v1';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  database: z.literal('up'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
