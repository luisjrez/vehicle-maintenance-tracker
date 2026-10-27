import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { healthResponseSchema } from '@vmt/shared';
import { createTestApp } from './create-test-app.js';

describe('GET /v1/health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports OK when the database is reachable', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health').expect(200);

    expect(healthResponseSchema.parse(response.body)).toEqual({ status: 'ok', database: 'up' });
  });
});
