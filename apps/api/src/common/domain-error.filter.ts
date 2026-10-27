import { type ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import type { ApiErrorBody } from '@vmt/shared';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { DomainError } from './domain-error.js';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const body: ApiErrorBody = {
      statusCode: exception.status,
      error: STATUS_CODES[exception.status] ?? 'Error',
      message: exception.message,
      code: exception.code,
      ...(exception.details === undefined ? {} : { details: exception.details }),
    };
    host.switchToHttp().getResponse<Response>().status(exception.status).json(body);
  }
}
