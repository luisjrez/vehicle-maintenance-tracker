/** Prisma returns `@db.Date` columns as UTC-midnight Dates; the API speaks `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** The server's calendar date in UTC; phones are at most a day apart from it. */
export function serverToday(now: Date = new Date()): string {
  return toIsoDate(now);
}
