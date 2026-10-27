import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

type Override = (builder: TestingModuleBuilder) => TestingModuleBuilder;

/** Boots the real AppModule with the production HTTP pipeline against the test database. */
export async function createTestApp(override: Override = (builder) => builder): Promise<INestApplication> {
  const moduleRef = await override(Test.createTestingModule({ imports: [AppModule] })).compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}
