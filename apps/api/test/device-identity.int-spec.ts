import type { INestApplication, LoggerService } from '@nestjs/common';
import request from 'supertest';
import { apiErrorBodySchema } from '@vmt/shared';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';

class RecordingLogger implements LoggerService {
  readonly lines: string[] = [];
  log(...parts: unknown[]): void {
    this.lines.push(parts.map(String).join(' '));
  }
  error(...parts: unknown[]): void {
    this.log(...parts);
  }
  warn(...parts: unknown[]): void {
    this.log(...parts);
  }
  debug(...parts: unknown[]): void {
    this.log(...parts);
  }
  verbose(...parts: unknown[]): void {
    this.log(...parts);
  }
}

describe('Device identity', () => {
  const prisma = createTestPrisma();
  const logger = new RecordingLogger();
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({ logger });
  });

  beforeEach(async () => {
    await resetOwners(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it.each([
    ['missing', undefined],
    ['malformed', 'definitely-not-a-device-id'],
  ])('rejects a %s Device ID with 401', async (_, deviceId) => {
    const call = request(app.getHttpServer()).get('/v1/owner');
    const response = await (deviceId === undefined ? call : call.set('X-Device-Id', deviceId)).expect(401);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('INVALID_DEVICE_ID');
    expect(await prisma.owner.count()).toBe(0);
  });

  it('creates an Owner and Device the first time it sees a Device ID, then reuses them', async () => {
    const deviceId = iosDeviceId();

    await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', deviceId).expect(200);
    await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', deviceId.toLowerCase()).expect(200);

    expect(await prisma.owner.count()).toBe(1);
    const devices = await prisma.device.findMany();
    expect(devices).toHaveLength(1);
    expect(devices[0]?.deviceIdHash).not.toContain(deviceId.toLowerCase());
  });

  it('scopes different Device IDs to different Owners', async () => {
    await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', iosDeviceId()).expect(200);
    await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', androidDeviceId()).expect(200);

    const owners = await prisma.owner.findMany({ include: { devices: true } });
    expect(owners).toHaveLength(2);
    expect(owners.every((owner) => owner.devices.length === 1)).toBe(true);
  });

  it('converges concurrent first requests from one device on a single Owner', async () => {
    const deviceId = androidDeviceId();

    await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', deviceId).expect(200),
      ),
    );

    expect(await prisma.owner.count({ where: { devices: { some: {} } } })).toBe(1);
  });

  it('never writes the Device ID to the logs', async () => {
    const deviceId = androidDeviceId();
    logger.lines.length = 0;

    await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', deviceId).expect(200);
    await request(app.getHttpServer()).get('/v1/does-not-exist').set('X-Device-Id', deviceId).expect(404);

    expect(logger.lines.some((line) => line.includes('GET /v1/owner 200'))).toBe(true);
    expect(logger.lines.join('\n').toLowerCase()).not.toContain(deviceId);
  });
});

describe('Per-device rate limit', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.THROTTLE_DEVICE_LIMIT = '3';
    app = await createTestApp();
  });

  afterAll(async () => {
    delete process.env.THROTTLE_DEVICE_LIMIT;
    await app.close();
  });

  it('answers 429 with a clear message once a device exceeds its budget', async () => {
    const deviceId = iosDeviceId();
    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', deviceId).expect(200);
    }

    const response = await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', deviceId).expect(429);

    const body = apiErrorBodySchema.parse(response.body);
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.message).toMatch(/too many requests/i);
    // Another device is unaffected.
    await request(app.getHttpServer()).get('/v1/owner').set('X-Device-Id', iosDeviceId()).expect(200);
  });
});
