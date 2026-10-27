import { StandardSchemaValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Env } from './config/env.js';
import { ENV } from './config/config.module.js';

/** JSON bodies above this are refused with 413 (ADR-0009); the largest real payload is a few KB. */
export const BODY_LIMIT = '100kb';

/**
 * Shared by main.ts and the integration tests so both run the same HTTP
 * pipeline. The app must be created with `bodyParser: false` so the limit
 * below is the only JSON parser.
 */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  const env = app.get<Env>(ENV);
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
  return app;
}
