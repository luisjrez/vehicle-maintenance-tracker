import { formatCents, formatDate, formatMiles } from './format';

describe('formatCents', () => {
  it('formats integer cents as US dollars', () => {
    expect(formatCents(123456)).toBe('$1,234.56');
    expect(formatCents(0)).toBe('$0.00');
  });

  it('can drop the cents for whole-dollar summaries', () => {
    expect(formatCents(123456, { wholeDollars: true })).toBe('$1,235');
  });
});

describe('formatMiles', () => {
  it('groups thousands and appends the unit', () => {
    expect(formatMiles(48210)).toBe('48,210 mi');
  });
});

describe('formatDate', () => {
  it('formats a calendar date without shifting it across time zones', () => {
    expect(formatDate('2025-03-04')).toBe('Mar 4, 2025');
  });
});
