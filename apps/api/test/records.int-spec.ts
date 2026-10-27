import type { INestApplication } from '@nestjs/common';
import { apiErrorBodySchema, serviceRecordListSchema, serviceRecordSchema, todayIsoDate, vehicleSchema } from '@vmt/shared';
import { asDevice } from './api-client.js';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { recordInput, vehicleInput } from './fixtures.js';

describe('Service records', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;
  let owner: ReturnType<typeof asDevice>;
  let vehicleId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetOwners(prisma);
    owner = asDevice(app, iosDeviceId());
    vehicleId = vehicleSchema.parse((await owner.post('/v1/vehicles', vehicleInput({ initialOdometer: 40_000 })).expect(201)).body).id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a record with catalog and custom line items, in USD cents', async () => {
    const input = recordInput({
      date: todayIsoDate(),
      odometer: 52_000,
      providerName: 'Honda of Downtown',
      providerType: 'dealer',
      notes: 'Asked about the rattle',
      totalCents: 42_995,
      lineItems: [
        { serviceSlug: 'scheduled-maintenance', packageCode: 'Honda B12', costCents: 18_900 },
        { serviceSlug: 'brake-pads', notes: 'Front axle' },
        { customName: 'Rattle diagnosis', costCents: 0 },
      ],
    });

    const record = serviceRecordSchema.parse((await owner.post(`/v1/vehicles/${vehicleId}/records`, input).expect(201)).body);

    expect(record).toMatchObject({
      vehicleId,
      date: todayIsoDate(),
      odometer: 52_000,
      providerType: 'dealer',
      totalCents: 42_995,
      currency: 'USD',
    });
    expect(record.lineItems.map((item) => item.serviceSlug ?? item.customName)).toEqual([
      'scheduled-maintenance',
      'brake-pads',
      'Rattle diagnosis',
    ]);
    expect(record.lineItems[0]?.packageCode).toBe('Honda B12');
  });

  it('lists a vehicle’s records newest first, and all of the Owner’s records', async () => {
    await owner.post(`/v1/vehicles/${vehicleId}/records`, recordInput({ date: '2025-01-10' })).expect(201);
    await owner.post(`/v1/vehicles/${vehicleId}/records`, recordInput({ date: '2026-02-01' })).expect(201);

    const forVehicle = serviceRecordListSchema.parse((await owner.get(`/v1/vehicles/${vehicleId}/records`).expect(200)).body);
    const all = serviceRecordListSchema.parse((await owner.get('/v1/records').expect(200)).body);

    expect(forVehicle.map((record) => record.date)).toEqual(['2026-02-01', '2025-01-10']);
    expect(all).toEqual(forVehicle);
  });

  it.each([
    ['no line items', recordInput({ lineItems: [] })],
    ['a negative total', recordInput({ totalCents: -5 })],
    ['a future date', recordInput({ date: '2999-01-01' })],
    ['an unknown service', recordInput({ lineItems: [{ serviceSlug: 'flux-capacitor' }] })],
    ['a line with both slug and custom name', recordInput({ lineItems: [{ serviceSlug: 'oil-change', customName: 'x' }] })],
  ])('rejects %s with 400', async (_, input) => {
    await owner.post(`/v1/vehicles/${vehicleId}/records`, input).expect(400);
  });

  it('hides another Owner’s vehicle behind a 404', async () => {
    const stranger = asDevice(app, androidDeviceId());

    const response = await stranger.post(`/v1/vehicles/${vehicleId}/records`, recordInput()).expect(404);
    await stranger.get(`/v1/vehicles/${vehicleId}/records`).expect(404);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('VEHICLE_NOT_FOUND');
    expect(serviceRecordListSchema.parse((await stranger.get('/v1/records').expect(200)).body)).toEqual([]);
  });
});
