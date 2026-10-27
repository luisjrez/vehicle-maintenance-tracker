import type { ServiceRecord } from '@vmt/shared';

/** Sum of record totals (the source of truth for spend) dated in `year`. */
export function spentInYear(records: readonly ServiceRecord[], year: number): number {
  const prefix = `${year}-`;
  return records.reduce((sum, record) => (record.date.startsWith(prefix) ? sum + record.totalCents : sum), 0);
}
