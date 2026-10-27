import { centsToDollarInput, type ServiceRecord } from '@vmt/shared';
import type { DraftLineItem, LogWorkDraft } from './log-work-draft';

/** Prefills the wizard from a saved record so every field can be edited (ticket 9). */
export function recordToDraft(record: ServiceRecord): Partial<LogWorkDraft> & { vehicleId: string } {
  return {
    vehicleId: record.vehicleId,
    recordId: record.id,
    step: 1,
    date: record.date,
    odometer: record.odometer === null ? '' : String(record.odometer),
    providerName: record.providerName ?? '',
    providerType: record.providerType,
    total: centsToDollarInput(record.totalCents),
    notes: record.notes ?? '',
    lineItems: record.lineItems.map(
      (item): DraftLineItem => ({
        key: item.id,
        serviceSlug: item.serviceSlug,
        customName: item.customName,
        cost: item.costCents === null ? '' : centsToDollarInput(item.costCents),
        notes: item.notes ?? '',
        packageCode: item.packageCode ?? '',
      }),
    ),
  };
}
