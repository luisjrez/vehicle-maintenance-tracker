import type { INestApplication } from '@nestjs/common';
import { apiErrorBodySchema, serviceRecordListSchema, serviceRecordSchema, vehicleSchema } from '@vmt/shared';
import { asDevice } from './api-client.js';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { recordInput, vehicleInput } from './fixtures.js';

describe('Record edit and delete', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;
  let owner: ReturnType<typeof asDevice>;
  let recordsPath: string;

  const create = async (overrides: Parameters<typeof recordInput>[0]) =>
    serviceRecordSchema.parse((await owner.post(recordsPath, recordInput(overrides)).expect(201)).body);

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetOwners(prisma);
    owner = asDevice(app, iosDeviceId());
    const vehicle = vehicleSchema.parse((await owner.post('/v1/vehicles', vehicleInput({ initialOdometer: 40_000 })).expect(201)).body);
    recordsPath = `/v1/vehicles/${vehicle.id}/records`;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('replaces every field and line item of a record', async () => {
    const record = await create({ date: '2024-01-01', odometer: 20_000, lineItems: [{ serviceSlug: 'oil-change' }] });

    const response = await owner
      .patch(`/v1/records/${record.id}`, recordInput({
        date: '2024-01-02',
        odometer: 21_000,
        providerType: 'diy',
        totalCents: 5_000,
        lineItems: [{ customName: 'Air filter', costCents: 2_500 }, { serviceSlug: 'wiper-blades' }],
      }))
      .expect(200);

    const updated = serviceRecordSchema.parse(response.body);
    expect(updated).toMatchObject({ id: record.id, date: '2024-01-02', odometer: 21_000, providerType: 'diy', totalCents: 5_000 });
    expect(updated.lineItems.map((item) => item.customName ?? item.serviceSlug)).toEqual(['Air filter', 'wiper-blades']);
    expect(await prisma.lineItem.count()).toBe(2);
  });

  it('re-validates an edit, excluding the record itself from the odometer check', async () => {
    await create({ date: '2024-01-01', odometer: 20_000 });
    const middle = await create({ date: '2024-06-01', odometer: 25_000 });
    await create({ date: '2024-12-01', odometer: 30_000 });

    await owner.patch(`/v1/records/${middle.id}`, recordInput({ date: '2024-06-01', odometer: 26_000 })).expect(200);
    const response = await owner.patch(`/v1/records/${middle.id}`, recordInput({ date: '2024-06-01', odometer: 35_000 })).expect(422);
    await owner.patch(`/v1/records/${middle.id}`, recordInput({ lineItems: [] })).expect(400);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('ODOMETER_INCONSISTENT');
  });

  it('hard-deletes a record and its line items', async () => {
    const record = await create({ date: '2024-01-01' });

    await owner.delete(`/v1/records/${record.id}`).expect(204);

    expect(serviceRecordListSchema.parse((await owner.get(recordsPath).expect(200)).body)).toEqual([]);
    expect(await prisma.lineItem.count()).toBe(0);
    await owner.delete(`/v1/records/${record.id}`).expect(404);
  });

  it('hides another Owner’s records', async () => {
    const record = await create({ date: '2024-01-01' });
    const stranger = asDevice(app, androidDeviceId());

    await stranger.patch(`/v1/records/${record.id}`, recordInput()).expect(404);
    await stranger.delete(`/v1/records/${record.id}`).expect(404);
  });
});
