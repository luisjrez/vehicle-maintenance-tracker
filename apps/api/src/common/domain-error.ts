/**
 * A business-rule failure with a stable `code` the app can react to. Services
 * throw these; `DomainErrorFilter` turns them into the API error envelope, so no
 * service depends on HTTP exceptions.
 */
export class DomainError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
