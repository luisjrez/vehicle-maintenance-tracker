import type { ServiceRecord } from '@vmt/shared';
import type { LineItem, ServiceRecord as RecordRow } from '../generated/prisma/client.js';
import { toIsoDate } from '../common/dates.js';

export type RecordRowWithItems = RecordRow & { lineItems: LineItem[] };

/** Line items come back in the order the Owner entered them. */
export const lineItemsInOrder = { lineItems: { orderBy: { position: 'asc' } } } as const;

export function toRecordDto(row: RecordRowWithItems): ServiceRecord {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    date: toIsoDate(row.date),
    odometer: row.odometer,
    providerName: row.providerName,
    providerType: row.providerType,
    notes: row.notes,
    totalCents: row.totalCents,
    currency: 'USD',
    lineItems: row.lineItems.map((item) => ({
      id: item.id,
      serviceSlug: item.serviceSlug,
      customName: item.customName,
      costCents: item.costCents,
      notes: item.notes,
      packageCode: item.packageCode,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
