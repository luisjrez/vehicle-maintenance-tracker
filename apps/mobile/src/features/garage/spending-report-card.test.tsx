import { fireEvent, render, screen } from '@testing-library/react-native';
import { recordFixture } from '@/test/fixtures';
import { SpendingReportCard } from './spending-report-card';

const line = (serviceSlug: string | null, costCents: number | null, customName: string | null = null) => ({
  id: `${serviceSlug ?? customName}-${costCents}`,
  serviceSlug,
  customName,
  costCents,
  notes: null,
  packageCode: null,
});

const records = [
  recordFixture({ date: '2026-04-20', totalCents: 78_400, lineItems: [line('tire-replacement', null), line('wheel-alignment', 12_000)] }),
  recordFixture({ date: '2026-09-05', totalCents: 4_200, lineItems: [line('engine-air-filter', 2_000), line('cabin-air-filter', 2_200)] }),
  recordFixture({ date: '2025-11-02', totalCents: 18_950, lineItems: [line('oil-change', 6_950), line(null, 12_000, 'Rust check')] }),
];

describe('SpendingReportCard', () => {
  it('shows the lifetime total and per-category bars, largest first', async () => {
    await render(<SpendingReportCard records={records} />);

    expect(screen.getByTestId('spending-total')).toHaveTextContent('$1,015.50');
    expect(screen.getAllByTestId(/^spending-category-/).map((bar) => bar.props.testID)).toEqual([
      'spending-category-tires-wheels',
      'spending-category-other',
      'spending-category-routine-maintenance',
    ]);
    expect(screen.getByTestId('spending-category-tires-wheels')).toHaveTextContent(/Tires & Wheels.*\$784\.00/);
    expect(screen.getByTestId('spending-category-routine-maintenance')).toHaveTextContent(/\$111\.50/);
  });

  it('filters by the years that have records', async () => {
    await render(<SpendingReportCard records={records} />);
    expect(screen.getByTestId('spending-year-2026')).toBeTruthy();
    expect(screen.getByTestId('spending-year-2025')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('spending-year-2025'));

    expect(screen.getByTestId('spending-total')).toHaveTextContent('$189.50');
    expect(screen.getByTestId('spending-category-other')).toHaveTextContent(/Other.*\$120\.00/);
    expect(screen.queryByTestId('spending-category-tires-wheels')).toBeNull();
  });
});
