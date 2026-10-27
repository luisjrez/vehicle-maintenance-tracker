import { type INestApplication, StandardSchemaValidationPipe, VersioningType } from '@nestjs/common';

/** Shared by main.ts and the integration tests so both run the same HTTP pipeline. */
export function configureApp(app: INestApplication): INestApplication {
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
  return app;
}
