import { daysBetween, todayIsoDate } from './dates.js';

describe('todayIsoDate', () => {
  it('uses the local calendar date, zero-padded', () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('daysBetween', () => {
  it('counts whole days in either direction, across month and year ends', () => {
    expect(daysBetween('2026-10-26', '2026-10-27')).toBe(1);
    expect(daysBetween('2026-01-01', '2025-12-31')).toBe(-1);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });
});
