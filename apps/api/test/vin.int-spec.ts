import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { apiErrorBodySchema, vinDecodeResponseSchema } from '@vmt/shared';
import { VinDecoder } from '../src/vin/vin-decoder.port.js';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { FakeVinDecoder } from './fake-vin-decoder.js';
import { vehicleInput } from './fixtures.js';

describe('VIN decode and VIN vehicles', () => {
  const prisma = createTestPrisma();
  const decoder = new FakeVinDecoder();
  let app: INestApplication;

  const decode = (vin: string, deviceId = iosDeviceId()) =>
    request(app.getHttpServer()).get(`/v1/vin/${vin}`).set('X-Device-Id', deviceId);

  beforeAll(async () => {
    process.env.THROTTLE_VIN_LIMIT = '5';
    app = await createTestApp({ override: (builder) => builder.overrideProvider(VinDecoder).useValue(decoder) });
  });

  beforeEach(async () => {
    await resetOwners(prisma);
    await prisma.vinDecodeCache.deleteMany();
    decoder.outage = false;
    decoder.calls.length = 0;
  });

  afterAll(async () => {
    delete process.env.THROTTLE_VIN_LIMIT;
    await app.close();
    await prisma.$disconnect();
  });

  it('decodes a valid VIN and serves the next lookup from the shared cache', async () => {
    const first = vinDecodeResponseSchema.parse((await decode('1hgcm82633a004352').expect(200)).body);
    const second = vinDecodeResponseSchema.parse((await decode('1HGCM82633A004352', androidDeviceId()).expect(200)).body);

    expect(first).toMatchObject({
      vin: '1HGCM82633A004352',
      status: 'decoded',
      details: { make: 'Honda', model: 'Accord', year: 2003, trim: 'EX-V6' },
    });
    expect(second).toEqual(first);
    expect(decoder.calls).toEqual(['1HGCM82633A004352']);
  });

  it('rejects an invalid VIN without calling vPIC', async () => {
    const response = await decode('1HGCM82633A004353').expect(400);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('INVALID_VIN');
    expect(decoder.calls).toEqual([]);
  });

  it('reports an outage as unavailable and never caches it', async () => {
    decoder.outage = true;
    const response = vinDecodeResponseSchema.parse((await decode('5YJ3E1EA2KF317000').expect(200)).body);
    decoder.outage = false;
    const retried = vinDecodeResponseSchema.parse((await decode('5YJ3E1EA2KF317000').expect(200)).body);

    expect(response.status).toBe('unavailable');
    expect(response.modelYearCandidates).toEqual([2019]);
    expect(retried.status).toBe('decoded');
    expect(decoder.calls).toHaveLength(2);
  });

  it('caches "no data" for about a day', async () => {
    const vin = '1M8GDM9AXKP042788';
    const response = vinDecodeResponseSchema.parse((await decode(vin).expect(200)).body);
    const cached = await prisma.vinDecodeCache.findUniqueOrThrow({ where: { vin } });

    expect(response.status).toBe('no_data');
    const hours = ((cached.expiresAt?.getTime() ?? 0) - cached.fetchedAt.getTime()) / 3_600_000;
    expect(hours).toBeCloseTo(24, 0);
    const hit = await prisma.vinDecodeCache.findUniqueOrThrow({ where: { vin: '1M8GDM9AXKP042788' } });
    expect(hit.status).toBe('no_data');
  });

  it('re-fetches "no data" once it has expired', async () => {
    const vin = '1M8GDM9AXKP042788';
    await decode(vin).expect(200);
    await prisma.vinDecodeCache.update({ where: { vin }, data: { expiresAt: new Date(Date.now() - 1000) } });

    await decode(vin).expect(200);

    expect(decoder.calls).toEqual([vin, vin]);
  });

  it('throttles VIN decodes per device with a clear 429', async () => {
    const deviceId = iosDeviceId();
    for (let i = 0; i < 5; i += 1) await decode('1HGCM82633A004352', deviceId).expect(200);

    const response = await decode('1HGCM82633A004352', deviceId).expect(429);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('RATE_LIMITED');
    // Other endpoints keep their own, looser budget.
    await request(app.getHttpServer()).get('/v1/vehicles').set('X-Device-Id', deviceId).expect(200);
  });

  it('keeps a VIN unique per Owner but allows the same VIN for another Owner', async () => {
    const vin = '1HGCM82633A004352';
    const mine = iosDeviceId();
    const post = (deviceId: string) =>
      request(app.getHttpServer()).post('/v1/vehicles').set('X-Device-Id', deviceId).send(vehicleInput({ vin }));

    await post(mine).expect(201);
    const duplicate = await post(mine).expect(409);
    await post(androidDeviceId()).expect(201);

    expect(apiErrorBodySchema.parse(duplicate.body)).toMatchObject({
      code: 'DUPLICATE_VIN',
      message: 'This vehicle is already in your garage.',
    });
  });

  it('rejects a vehicle with an invalid VIN', async () => {
    await request(app.getHttpServer())
      .post('/v1/vehicles')
      .set('X-Device-Id', iosDeviceId())
      .send(vehicleInput({ vin: '1HGCM82633A004353' }))
      .expect(400);
  });
});
