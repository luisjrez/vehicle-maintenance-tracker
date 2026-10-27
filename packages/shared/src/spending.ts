import { categoryBySlug, categoryOfService, OTHER_CATEGORY_SLUG } from './catalog.js';

type ReportLine = { serviceSlug: string | null; customName: string | null; costCents: number | null };
type ReportRecord = { date: string; totalCents: number; lineItems: readonly ReportLine[] };

export type CategorySpend = { slug: string; name: string; cents: number };
export type SpendingReport = { totalCents: number; categories: CategorySpend[]; years: number[] };

const yearOf = (isoDate: string): number => Number(isoDate.slice(0, 4));

function categorySlugOf(line: ReportLine): string {
  return line.serviceSlug === null ? OTHER_CATEGORY_SLUG : (categoryOfService(line.serviceSlug)?.slug ?? OTHER_CATEGORY_SLUG);
}

/**
 * Splits one record's total across categories. Line costs go to their service's
 * category and any unallocated remainder to the first line's category. If the
 * costs add up to more than the total (the total is the source of truth for
 * spend), they are scaled down so the categories still sum to the total.
 */
function allocate(record: ReportRecord, into: Map<string, number>): void {
  const add = (slug: string, cents: number) => {
    if (cents > 0) into.set(slug, (into.get(slug) ?? 0) + cents);
  };
  const allocated = record.lineItems.reduce((sum, line) => sum + (line.costCents ?? 0), 0);
  const scale = allocated > record.totalCents ? record.totalCents / allocated : 1;
  let assigned = 0;
  for (const line of record.lineItems) {
    const cents = Math.floor((line.costCents ?? 0) * scale);
    add(categorySlugOf(line), cents);
    assigned += cents;
  }
  const first = record.lineItems[0];
  if (first !== undefined) add(categorySlugOf(first), record.totalCents - assigned);
}

/** Spend per category for one vehicle, for a year or all time (`year` omitted). */
export function spendingReport(records: readonly ReportRecord[], year?: number): SpendingReport {
  const years = [...new Set(records.map((record) => yearOf(record.date)))].sort((a, b) => b - a);
  const selected = year === undefined ? records : records.filter((record) => yearOf(record.date) === year);
  const byCategory = new Map<string, number>();
  for (const record of selected) allocate(record, byCategory);
  const categories = [...byCategory.entries()]
    .map(([slug, cents]) => ({ slug, name: categoryBySlug(slug)?.name ?? 'Other', cents }))
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name));
  return { totalCents: selected.reduce((sum, record) => sum + record.totalCents, 0), categories, years };
}
