import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { apiErrorBodySchema } from '@vmt/shared';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { vehicleInput } from './fixtures.js';

describe('Abuse limits', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;

  const fromIp = (ip: string, deviceId: string) =>
    request(app.getHttpServer()).get('/v1/owner').set('X-Forwarded-For', ip).set('X-Device-Id', deviceId);

  beforeAll(async () => {
    process.env.THROTTLE_NEW_OWNERS_LIMIT = '3';
    process.env.TRUST_PROXY_HOPS = '1';
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetOwners(prisma);
  });

  afterAll(async () => {
    delete process.env.THROTTLE_NEW_OWNERS_LIMIT;
    delete process.env.TRUST_PROXY_HOPS;
    await app.close();
    await prisma.$disconnect();
  });

  it('caps new Owners per client IP, without blocking devices it already knows or other networks', async () => {
    const known = iosDeviceId();
    await fromIp('203.0.113.7', known).expect(200);
    await fromIp('203.0.113.7', androidDeviceId()).expect(200);
    await fromIp('203.0.113.7', androidDeviceId()).expect(200);

    const blocked = await fromIp('203.0.113.7', androidDeviceId()).expect(429);

    expect(apiErrorBodySchema.parse(blocked.body).code).toBe('TOO_MANY_NEW_DEVICES');
    expect(await prisma.owner.count()).toBe(3);
    await fromIp('203.0.113.7', known).expect(200);
    await fromIp('198.51.100.20', androidDeviceId()).expect(200);
  });

  it('refuses request bodies over 100 KB', async () => {
    const huge = { ...vehicleInput(), nickname: 'x'.repeat(150 * 1024) };

    const response = await request(app.getHttpServer())
      .post('/v1/vehicles')
      .set('X-Device-Id', iosDeviceId())
      .send(huge)
      .expect(413);

    expect(apiErrorBodySchema.safeParse(response.body).success).toBe(true);
  });

  it('still accepts normal bodies', async () => {
    await request(app.getHttpServer()).post('/v1/vehicles').set('X-Device-Id', iosDeviceId()).send(vehicleInput()).expect(201);
  });
});
