import type { INestApplication } from '@nestjs/common';
import { apiErrorBodySchema, vehicleSchema } from '@vmt/shared';
import { asDevice } from './api-client.js';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { recordInput, vehicleInput } from './fixtures.js';

describe('Vehicle details: edit and delete', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;
  let owner: ReturnType<typeof asDevice>;
  let vehicleId: string;
  const vin = '1HGCM82633A004352';

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetOwners(prisma);
    owner = asDevice(app, iosDeviceId());
    const created = await owner
      .post('/v1/vehicles', vehicleInput({ vin, initialOdometer: 40_000, nickname: 'Daily', bodyClass: 'Coupe' }))
      .expect(201);
    vehicleId = vehicleSchema.parse(created.body).id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('reads and edits any field, clearing optional ones with null', async () => {
    const response = await owner
      .patch(`/v1/vehicles/${vehicleId}`, { nickname: null, bodyClass: 'Sedan', year: 2004, plate: '8XYZ999', initialOdometer: 41_000 })
      .expect(200);

    const updated = vehicleSchema.parse(response.body);
    expect(updated).toMatchObject({ nickname: null, bodyClass: 'Sedan', year: 2004, plate: '8XYZ999', initialOdometer: 41_000, vin });
    expect(vehicleSchema.parse((await owner.get(`/v1/vehicles/${vehicleId}`).expect(200)).body)).toEqual(updated);
  });

  it('validates an edited VIN like a new one, and allows removing it', async () => {
    await owner.patch(`/v1/vehicles/${vehicleId}`, { vin: '1HGCM82633A004353' }).expect(400);
    const cleared = vehicleSchema.parse((await owner.patch(`/v1/vehicles/${vehicleId}`, { vin: null }).expect(200)).body);

    expect(cleared.vin).toBeNull();
  });

  it('rejects an initial odometer edit that would break the log', async () => {
    await owner.post(`/v1/vehicles/${vehicleId}/records`, recordInput({ date: '2024-01-01', odometer: 35_000 })).expect(201);

    const response = await owner.patch(`/v1/vehicles/${vehicleId}`, { initialOdometer: 30_000 }).expect(422);

    expect(apiErrorBodySchema.parse(response.body).message).toBe(
      'The odometer can’t be lower than 35,000 mi, recorded on Jan 1, 2024.',
    );
  });

  it('hard-deletes a vehicle with its records, after which the same VIN can be added again', async () => {
    await owner.post(`/v1/vehicles/${vehicleId}/records`, recordInput({ date: '2024-01-01', odometer: 35_000 })).expect(201);
    await owner.post(`/v1/vehicles/${vehicleId}/records`, recordInput({ date: '2024-02-01' })).expect(201);

    await owner.delete(`/v1/vehicles/${vehicleId}`).expect(204);

    expect(await prisma.serviceRecord.count()).toBe(0);
    expect(await prisma.lineItem.count()).toBe(0);
    await owner.get(`/v1/vehicles/${vehicleId}`).expect(404);
    await owner.post('/v1/vehicles', vehicleInput({ vin })).expect(201);
  });

  it('isolates Owners: another Owner can neither read, edit nor delete the vehicle', async () => {
    const stranger = asDevice(app, androidDeviceId());

    await stranger.get(`/v1/vehicles/${vehicleId}`).expect(404);
    await stranger.patch(`/v1/vehicles/${vehicleId}`, { nickname: 'Mine now' }).expect(404);
    await stranger.delete(`/v1/vehicles/${vehicleId}`).expect(404);

    expect(vehicleSchema.parse((await owner.get(`/v1/vehicles/${vehicleId}`).expect(200)).body).nickname).toBe('Daily');
  });
});
