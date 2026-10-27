import type { INestApplication, LoggerService } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

type Options = {
  override?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
  logger?: LoggerService | false;
};

/** Boots the real AppModule with the production HTTP pipeline against the test database. */
export async function createTestApp({ override, logger = false }: Options = {}): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  const moduleRef = await (override === undefined ? builder : override(builder)).compile();
  const app = configureApp(moduleRef.createNestApplication({ logger }));
  await app.init();
  return app;
}
