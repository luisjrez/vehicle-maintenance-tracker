// en-US display helpers (ADR-0002): money is integer cents, odometer is integer miles.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});
const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const calendarDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatCents(cents: number, options: { wholeDollars?: boolean } = {}): string {
  return (options.wholeDollars === true ? usdWhole : usd).format(cents / 100);
}

export function formatMiles(miles: number): string {
  return `${integer.format(miles)} mi`;
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

/**
 * Formats a `YYYY-MM-DD` calendar date. It is read and printed in UTC so the
 * day never shifts with the phone's time zone.
 */
export function formatDate(isoDate: string): string {
  return calendarDate.format(new Date(`${isoDate}T00:00:00Z`));
}
