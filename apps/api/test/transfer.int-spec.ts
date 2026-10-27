import type { INestApplication } from '@nestjs/common';
import { apiErrorBodySchema, issuedTransferCodeSchema, redeemedTransferSchema, vehicleListSchema } from '@vmt/shared';
import { asDevice } from './api-client.js';
import { createTestApp } from './create-test-app.js';
import { createTestPrisma, resetOwners } from './database.js';
import { androidDeviceId, iosDeviceId } from './device-ids.js';
import { recordInput, vehicleInput } from './fixtures.js';

describe('Transfer to another phone', () => {
  const prisma = createTestPrisma();
  let app: INestApplication;
  let oldPhone: ReturnType<typeof asDevice>;
  let newPhone: ReturnType<typeof asDevice>;

  const issue = async () => issuedTransferCodeSchema.parse((await oldPhone.post('/v1/transfer-codes', {}).expect(201)).body).code;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetOwners(prisma);
    oldPhone = asDevice(app, iosDeviceId());
    newPhone = asDevice(app, androidDeviceId());
    const vehicle = await oldPhone.post('/v1/vehicles', vehicleInput({ nickname: 'Daily' })).expect(201);
    await oldPhone.post(`/v1/vehicles/${String(vehicle.body.id)}/records`, recordInput()).expect(201);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('moves the Owner to the new phone and starts the old phone over, empty', async () => {
    const code = await issue();

    const redeemed = redeemedTransferSchema.parse((await newPhone.post('/v1/transfer-codes/redeem', { code }).expect(200)).body);

    expect(redeemed.vehicleCount).toBe(1);
    const onNewPhone = vehicleListSchema.parse((await newPhone.get('/v1/vehicles').expect(200)).body);
    expect(onNewPhone.map((vehicle) => vehicle.nickname)).toEqual(['Daily']);
    expect(vehicleListSchema.parse((await oldPhone.get('/v1/vehicles').expect(200)).body)).toEqual([]);
    expect(await prisma.serviceRecord.count()).toBe(1);
    // Old phone (fresh Owner) + new phone: never two devices on one Owner.
    const owners = await prisma.owner.findMany({ include: { _count: { select: { devices: true } } } });
    expect(owners.map((owner) => owner._count.devices)).toEqual([1, 1]);
  });

  it('asks for confirmation when the receiving phone already has data, then replaces it', async () => {
    await newPhone.post('/v1/vehicles', vehicleInput({ nickname: 'Old data' })).expect(201);
    await newPhone.post('/v1/vehicles', vehicleInput({ nickname: 'More old data' })).expect(201);
    const code = await issue();

    const conflict = await newPhone.post('/v1/transfer-codes/redeem', { code }).expect(409);
    const body = apiErrorBodySchema.parse(conflict.body);
    expect(body).toMatchObject({ code: 'TRANSFER_CONFLICT', details: { vehicleCount: 2 } });
    expect(body.message).toBe('This phone has 2 vehicles; they will be deleted and replaced.');

    await newPhone.post('/v1/transfer-codes/redeem', { code, replaceExisting: true }).expect(200);

    const vehicles = vehicleListSchema.parse((await newPhone.get('/v1/vehicles').expect(200)).body);
    expect(vehicles.map((vehicle) => vehicle.nickname)).toEqual(['Daily']);
    expect(await prisma.vehicle.count()).toBe(1);
  });

  it('rejects a code that was already used', async () => {
    const code = await issue();
    await newPhone.post('/v1/transfer-codes/redeem', { code }).expect(200);

    const third = asDevice(app, iosDeviceId());
    const response = await third.post('/v1/transfer-codes/redeem', { code }).expect(410);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('TRANSFER_CODE_INVALID');
  });

  it('rejects a code superseded by a newer one', async () => {
    const first = await issue();
    await issue();

    await newPhone.post('/v1/transfer-codes/redeem', { code: first }).expect(410);
  });

  it('rejects an expired code', async () => {
    const code = await issue();
    await prisma.transferCode.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    await newPhone.post('/v1/transfer-codes/redeem', { code }).expect(410);
  });

  it('refuses to redeem on the phone that issued the code', async () => {
    const code = await issue();

    const response = await oldPhone.post('/v1/transfer-codes/redeem', { code }).expect(400);

    expect(apiErrorBodySchema.parse(response.body).code).toBe('TRANSFER_SAME_PHONE');
  });

  it('stores only a hash of the code', async () => {
    const code = await issue();

    const rows = await prisma.transferCode.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.codeHash).not.toContain(code);
  });
});
