import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false }));
  await app.listen(env.PORT, '0.0.0.0');
}

await bootstrap();
