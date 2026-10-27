import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { apiErrorBodySchema, MAX_VEHICLES_PER_OWNER, vehicleListSchema, vehicleSchema } from '@vmt/shared';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { vehicleInput } from './fixtures.js';

describe('Vehicles', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;

  const asDevice = (deviceId: string) => ({
    get: (path: string) => request(app.getHttpServer()).get(path).set('X-Device-Id', deviceId),
    post: (path: string, body: object) => request(app.getHttpServer()).post(path).set('X-Device-Id', deviceId).send(body),
  });

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetOwners(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a manual vehicle stamped with its initial odometer date and lists it', async () => {
    const owner = asDevice(iosDeviceId());
    const input = vehicleInput({ nickname: 'Daily', plate: '7ABC123', plateState: 'CA', trim: 'EX' });

    const created = vehicleSchema.parse((await owner.post('/v1/vehicles', input).expect(201)).body);

    expect(created).toMatchObject({
      vin: null,
      year: 2019,
      make: 'Honda',
      model: 'Civic',
      trim: 'EX',
      nickname: 'Daily',
      plate: '7ABC123',
      plateState: 'CA',
      initialOdometer: 47_750,
      initialOdometerDate: input.initialOdometerDate,
    });
    const listed = vehicleListSchema.parse((await owner.get('/v1/vehicles').expect(200)).body);
    expect(listed).toEqual([created]);
  });

  it('rejects a vehicle without an initial odometer', async () => {
    const { initialOdometer: _omit, ...withoutOdometer } = vehicleInput();

    const response = await asDevice(iosDeviceId()).post('/v1/vehicles', withoutOdometer).expect(400);

    expect(JSON.stringify(apiErrorBodySchema.parse(response.body).message)).toContain('initialOdometer');
  });

  it('rejects an initial odometer date that is not today', async () => {
    const response = await asDevice(iosDeviceId())
      .post('/v1/vehicles', vehicleInput({ initialOdometerDate: '2020-01-01' }))
      .expect(400);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('INVALID_DATE');
  });

  it('only lists the calling Owner’s vehicles', async () => {
    await asDevice(iosDeviceId()).post('/v1/vehicles', vehicleInput({ make: 'Toyota', model: 'RAV4' })).expect(201);

    const other = vehicleListSchema.parse((await asDevice(androidDeviceId()).get('/v1/vehicles').expect(200)).body);

    expect(other).toEqual([]);
  });

  it(`caps an Owner at ${MAX_VEHICLES_PER_OWNER} vehicles with a clear message, even under concurrency`, async () => {
    const owner = asDevice(iosDeviceId());
    await owner.get('/v1/owner').expect(200);
    const ownerRow = await prisma.owner.findFirstOrThrow();
    await prisma.vehicle.createMany({
      data: Array.from({ length: MAX_VEHICLES_PER_OWNER - 1 }, (_, index) => ({
        ownerId: ownerRow.id,
        year: 2010,
        make: 'Ford',
        model: `Model ${index}`,
        initialOdometer: 1000,
        initialOdometerDate: new Date(),
      })),
    });

    const results = await Promise.all([
      owner.post('/v1/vehicles', vehicleInput()),
      owner.post('/v1/vehicles', vehicleInput()),
      owner.post('/v1/vehicles', vehicleInput()),
    ]);

    expect(results.map((response) => response.status).toSorted((a, b) => a - b)).toEqual([201, 409, 409]);
    const rejected = results.find((response) => response.status === 409);
    const body = apiErrorBodySchema.parse(rejected?.body);
    expect(body.code).toBe('VEHICLE_LIMIT_REACHED');
    expect(body.message).toContain('up to 20 vehicles');
    expect(await prisma.vehicle.count()).toBe(MAX_VEHICLES_PER_OWNER);
  });
});
