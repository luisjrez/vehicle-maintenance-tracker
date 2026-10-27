import type { INestApplication } from '@nestjs/common';
import { apiErrorBodySchema, vehicleSchema } from '@vmt/shared';
import { asDevice } from './api-client.js';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { iosDeviceId } from './device-ids.js';
import { recordInput, vehicleInput } from './fixtures.js';

describe('Odometer consistency', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;
  let owner: ReturnType<typeof asDevice>;
  let recordsPath: string;

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

  it('accepts out-of-order backfilling as long as the log stays coherent', async () => {
    await owner.post(recordsPath, recordInput({ date: '2024-06-01', odometer: 20_000 })).expect(201);
    await owner.post(recordsPath, recordInput({ date: '2022-01-15', odometer: 5_000 })).expect(201);
    await owner.post(recordsPath, recordInput({ date: '2023-03-10', odometer: 12_000 })).expect(201);
    await owner.post(recordsPath, recordInput({ date: '2023-03-10', odometer: null })).expect(201);
  });

  it('rejects a backfilled record that breaks monotonicity, naming the conflicting reading', async () => {
    await owner.post(recordsPath, recordInput({ date: '2024-06-01', odometer: 20_000 })).expect(201);

    const response = await owner.post(recordsPath, recordInput({ date: '2023-03-10', odometer: 25_000 })).expect(422);

    const body = apiErrorBodySchema.parse(response.body);
    expect(body.code).toBe('ODOMETER_INCONSISTENT');
    expect(body.message).toBe('The odometer can’t be higher than 20,000 mi, recorded on Jun 1, 2024.');
    expect(body.details).toMatchObject({ conflict: { side: 'after', odometer: 20_000, date: '2024-06-01' } });
  });

  it('treats the initial odometer as a reading on the creation date', async () => {
    const response = await owner.post(recordsPath, recordInput({ date: '2020-01-01', odometer: 45_000 })).expect(422);

    expect(apiErrorBodySchema.parse(response.body).message).toMatch(/when you added this vehicle/);
  });

  it('keeps the log coherent under concurrent saves', async () => {
    await owner.post(recordsPath, recordInput({ date: '2023-01-01', odometer: 10_000 })).expect(201);

    const results = await Promise.all([
      owner.post(recordsPath, recordInput({ date: '2023-06-01', odometer: 30_000 })),
      owner.post(recordsPath, recordInput({ date: '2023-09-01', odometer: 20_000 })),
    ]);

    expect(results.map((response) => response.status).toSorted((a, b) => a - b)).toEqual([201, 422]);
  });
});
