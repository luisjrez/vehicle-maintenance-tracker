import { apiErrorBodySchema } from '@vmt/shared';
import { strings } from '../strings';

export type ApiFailure =
  | { kind: 'network' }
  | { kind: 'http'; status: number; message: string; code: string | undefined; details: Record<string, unknown> };

export class ApiError extends Error {
  constructor(readonly failure: ApiFailure) {
    super(failure.kind === 'network' ? strings.errors.network : failure.message);
    this.name = 'ApiError';
  }
}

/** Reads the API's error envelope; anything unexpected becomes a generic message. */
export function parseErrorBody(payload: unknown): { message: string; code: string | undefined; details: Record<string, unknown> } {
  const parsed = apiErrorBodySchema.safeParse(payload);
  if (!parsed.success) {
    return { message: strings.errors.unexpected, code: undefined, details: {} };
  }
  const { message, code, details } = parsed.data;
  return { message: Array.isArray(message) ? message.join('\n') : message, code, details: details ?? {} };
}

/** The message to show the Owner for any failure thrown by `apiRequest`. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : strings.errors.unexpected;
}
