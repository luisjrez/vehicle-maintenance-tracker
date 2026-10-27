// Money is integer cents in USD (ADR-0002); parsing never goes through floats.

/** Parses what an Owner types ("$1,234.56", "189") into integer cents, or undefined. */
export function parseDollarsToCents(input: string): number | undefined {
  const cleaned = input.trim().replace(/^\$/, '').replaceAll(',', '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (match === null) return undefined;
  const dollars = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  return dollars * 100 + cents;
}

const groupThousands = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function centsToDollarInput(cents: number): string {
  return `${groupThousands(String(Math.floor(cents / 100)))}.${String(cents % 100).padStart(2, '0')}`;
}

/**
 * Re-formats a money field on every keystroke: thousands separators, one decimal
 * point and at most two decimals. A trailing "." survives so "89." can become "89.5".
 */
export function formatDollarInput(typed: string): string {
  const kept = typed.replace(/[^\d.]/g, '');
  const point = kept.indexOf('.');
  const wholeDigits = point === -1 ? kept : kept.slice(0, point);
  const decimals = point === -1 ? undefined : kept.slice(point + 1).replaceAll('.', '').slice(0, 2);
  const whole = wholeDigits.replace(/^0+(?=\d)/, '');
  if (decimals === undefined) return groupThousands(whole);
  return `${groupThousands(whole === '' ? '0' : whole)}.${decimals}`;
}
