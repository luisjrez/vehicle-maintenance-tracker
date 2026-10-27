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

export function centsToDollarInput(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
