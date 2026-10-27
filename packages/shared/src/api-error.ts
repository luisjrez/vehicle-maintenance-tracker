import { z } from 'zod';

/**
 * Error envelope returned by every API failure. `code` identifies domain errors
 * the app reacts to (e.g. `VEHICLE_LIMIT_REACHED`); `message` is English copy
 * that can be shown as-is; `details` carries data such as a conflicting reading.
 */
export const apiErrorBodySchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
