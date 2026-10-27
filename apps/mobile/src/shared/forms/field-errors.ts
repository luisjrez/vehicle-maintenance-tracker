import type { z } from 'zod';

/** First message per top-level field, for showing Zod issues next to their inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/** Parses a typed integer; blank or non-numeric input becomes undefined so the schema reports it. */
export function parseInteger(text: string): number | undefined {
  const digits = text.replace(/[,\s]/g, '');
  return /^-?\d+$/.test(digits) ? Number(digits) : undefined;
}

/** Parses a typed decimal (e.g. displacement in liters). */
export function parseDecimal(text: string): number | undefined {
  const value = text.trim();
  return /^\d+(\.\d+)?$/.test(value) ? Number(value) : undefined;
}
