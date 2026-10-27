import { z } from 'zod';
import { catalogServiceBySlug, SCHEDULED_MAINTENANCE_SLUG } from './catalog.js';
import { daysBetween, isoDateSchema, todayIsoDate } from './dates.js';
import { odometerSchema } from './vehicle.js';

export const PROVIDER_TYPES = ['dealer', 'chain', 'independent', 'diy'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];
export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  dealer: 'Dealer',
  chain: 'Chain',
  independent: 'Independent shop',
  diy: 'DIY',
};

/** $1,000,000 — a sanity bound, not a business rule. */
export const MAX_CENTS = 100_000_000;
export const MAX_LINE_ITEMS = 30;

const centsSchema = z
  .number({ error: 'Enter an amount in dollars.' })
  .int('Enter an amount in dollars and cents.')
  .min(0, 'The amount cannot be negative.')
  .max(MAX_CENTS, 'That amount is too large.');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters.`)
    .transform((value) => (value === '' ? undefined : value))
    .optional();

export const lineItemInputSchema = z
  .object({
    serviceSlug: z
      .string()
      .refine((slug) => catalogServiceBySlug(slug) !== undefined, 'Choose a service from the list.')
      .optional(),
    customName: optionalText(60),
    costCents: centsSchema.optional(),
    notes: optionalText(500),
    /** e.g. "Honda B12" or "30k service"; only on scheduled maintenance (ADR-0004). */
    packageCode: optionalText(40),
  })
  .refine((item) => (item.serviceSlug === undefined) !== (item.customName === undefined), {
    message: 'Each line needs a service from the list or a custom name, not both.',
  })
  .refine((item) => item.packageCode === undefined || item.serviceSlug === SCHEDULED_MAINTENANCE_SLUG, {
    message: 'A package code only applies to scheduled maintenance.',
    path: ['packageCode'],
  });

export type LineItemInput = z.input<typeof lineItemInputSchema>;

// Phones and the server can be a day apart across US time zones; the app also
// checks the Owner's local date, so the API only needs to stop obvious future dates.
const notInFuture = (date: string) => daysBetween(todayIsoDate(), date) <= 1;

export const createRecordSchema = z.object({
  date: isoDateSchema.refine(notInFuture, 'The date cannot be in the future.'),
  odometer: odometerSchema.nullable().optional(),
  providerName: optionalText(80),
  providerType: z.enum(PROVIDER_TYPES, { error: 'Choose a provider type.' }).optional(),
  notes: optionalText(1000),
  totalCents: centsSchema,
  lineItems: z
    .array(lineItemInputSchema)
    .min(1, 'Add at least one service.')
    .max(MAX_LINE_ITEMS, `Use at most ${MAX_LINE_ITEMS} services per record.`),
});

export type CreateRecordInput = z.input<typeof createRecordSchema>;
export type CreateRecord = z.output<typeof createRecordSchema>;

export const lineItemSchema = z.object({
  id: z.string(),
  serviceSlug: z.string().nullable(),
  customName: z.string().nullable(),
  costCents: z.number().int().nullable(),
  notes: z.string().nullable(),
  packageCode: z.string().nullable(),
});
export type LineItem = z.infer<typeof lineItemSchema>;

export const serviceRecordSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  date: isoDateSchema,
  odometer: z.number().int().nullable(),
  providerName: z.string().nullable(),
  providerType: z.enum(PROVIDER_TYPES).nullable(),
  notes: z.string().nullable(),
  totalCents: z.number().int(),
  currency: z.literal('USD'),
  lineItems: z.array(lineItemSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ServiceRecord = z.infer<typeof serviceRecordSchema>;
export const serviceRecordListSchema = z.array(serviceRecordSchema);

/** What a line item is called in lists: the catalog name, or the custom name. */
export function lineItemName(item: Pick<LineItem, 'serviceSlug' | 'customName'>): string {
  if (item.serviceSlug !== null) return catalogServiceBySlug(item.serviceSlug)?.name ?? item.serviceSlug;
  return item.customName ?? 'Service';
}

/** Newest first; same-day records keep the most recently created on top. */
export function compareRecordsNewestFirst(a: ServiceRecord, b: ServiceRecord): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}
