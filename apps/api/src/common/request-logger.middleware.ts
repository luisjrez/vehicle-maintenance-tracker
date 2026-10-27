import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Logs one line per request: method, path, status and duration. Headers and
 * bodies are never logged — the Device ID is a bearer credential (ADR-0001).
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = performance.now();
    response.on('finish', () => {
      const elapsed = Math.round(performance.now() - startedAt);
      this.logger.log(`${request.method} ${request.path} ${response.statusCode} ${elapsed}ms`);
    });
    next();
  }
}
