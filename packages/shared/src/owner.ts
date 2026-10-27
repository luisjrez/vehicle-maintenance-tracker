import { z } from 'zod';

/** What the calling Owner looks like from the app's side. The internal id is never exposed. */
export const ownerSummarySchema = z.object({
  createdAt: z.iso.datetime(),
});

export type OwnerSummary = z.infer<typeof ownerSummarySchema>;
