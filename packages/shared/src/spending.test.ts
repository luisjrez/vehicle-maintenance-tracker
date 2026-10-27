import { spendingReport } from './spending.js';

type TestRecord = Parameters<typeof spendingReport>[0][number];

function record(date: string, totalCents: number, lineItems: TestRecord['lineItems']): TestRecord {
  return { date, totalCents, lineItems };
}

const line = (serviceSlug: string | null, costCents: number | null = null, customName: string | null = null) => ({
  serviceSlug,
  customName,
  costCents,
});

describe('spendingReport', () => {
  it('charges line-item costs to their service category', () => {
    const report = spendingReport([record('2026-03-01', 30_000, [line('oil-change', 10_000), line('brake-pads', 20_000)])]);

    expect(report.totalCents).toBe(30_000);
    expect(report.categories).toEqual([
      { slug: 'brakes', name: 'Brakes', cents: 20_000 },
      { slug: 'routine-maintenance', name: 'Routine Maintenance', cents: 10_000 },
    ]);
  });

  it('sends the unallocated remainder to the first line item’s category', () => {
    const report = spendingReport([record('2026-03-01', 50_000, [line('tire-rotation'), line('oil-change', 8_000)])]);

    expect(report.categories).toEqual([
      { slug: 'tires-wheels', name: 'Tires & Wheels', cents: 42_000 },
      { slug: 'routine-maintenance', name: 'Routine Maintenance', cents: 8_000 },
    ]);
  });

  it('puts custom services under Other', () => {
    const report = spendingReport([record('2026-03-01', 7_500, [line(null, null, 'Rust check')])]);

    expect(report.categories).toEqual([{ slug: 'other', name: 'Other', cents: 7_500 }]);
  });

  it('scales line costs down when they add up to more than the total, so categories match the total', () => {
    const report = spendingReport([record('2026-03-01', 10_000, [line('oil-change', 10_000), line('brake-pads', 10_000)])]);

    expect(report.categories.reduce((sum, category) => sum + category.cents, 0)).toBe(10_000);
    expect(report.categories.map((category) => category.cents)).toEqual([5_000, 5_000]);
  });

  it('filters by year and lists the years that have records, newest first', () => {
    const records = [
      record('2025-05-01', 10_000, [line('oil-change')]),
      record('2026-02-01', 20_000, [line('brake-pads')]),
      record('2026-08-01', 5_000, [line('oil-change')]),
    ];

    expect(spendingReport(records).years).toEqual([2026, 2025]);
    expect(spendingReport(records).totalCents).toBe(35_000);
    expect(spendingReport(records, 2026).totalCents).toBe(25_000);
    expect(spendingReport(records, 2025).categories).toEqual([
      { slug: 'routine-maintenance', name: 'Routine Maintenance', cents: 10_000 },
    ]);
    expect(spendingReport(records, 2024)).toMatchObject({ totalCents: 0, categories: [] });
  });

  it('counts $0 records without creating empty bars', () => {
    expect(spendingReport([record('2026-03-01', 0, [line('recall-service')])]).categories).toEqual([]);
  });
});
