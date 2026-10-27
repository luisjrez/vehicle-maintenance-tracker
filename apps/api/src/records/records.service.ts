import { Injectable } from '@nestjs/common';
import { checkOdometerConsistency, type CreateRecord, type ServiceRecord } from '@vmt/shared';
import { DomainError } from '../common/domain-error.js';
import { fromIsoDate, toIsoDate } from '../common/dates.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { lineItemsInOrder, toRecordDto } from './record.mapper.js';

export const vehicleNotFound = () =>
  new DomainError(404, 'VEHICLE_NOT_FOUND', 'This vehicle no longer exists. Pull to refresh your garage.');

/** Maps validated input to Prisma's nested line-item create, keeping the entry order. */
export function lineItemRows(input: CreateRecord) {
  return input.lineItems.map((item, position) => ({
    position,
    serviceSlug: item.serviceSlug ?? null,
    customName: item.customName ?? null,
    costCents: item.costCents ?? null,
    notes: item.notes ?? null,
    packageCode: item.packageCode ?? null,
  }));
}

export function recordColumns(input: CreateRecord) {
  return {
    date: fromIsoDate(input.date),
    odometer: input.odometer ?? null,
    providerName: input.providerName ?? null,
    providerType: input.providerType ?? null,
    notes: input.notes ?? null,
    totalCents: input.totalCents,
  };
}

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOwner(ownerId: string): Promise<ServiceRecord[]> {
    const rows = await this.prisma.serviceRecord.findMany({
      where: { vehicle: { ownerId } },
      include: lineItemsInOrder,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toRecordDto);
  }

  async listForVehicle(ownerId: string, vehicleId: string): Promise<ServiceRecord[]> {
    await this.assertOwnVehicle(ownerId, vehicleId);
    const rows = await this.prisma.serviceRecord.findMany({
      where: { vehicleId },
      include: lineItemsInOrder,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toRecordDto);
  }

  async create(ownerId: string, vehicleId: string, input: CreateRecord): Promise<ServiceRecord> {
    const row = await this.prisma.$transaction(async (tx) => {
      await assertOdometerConsistent(tx, ownerId, vehicleId, { date: input.date, odometer: input.odometer ?? null });
      return tx.serviceRecord.create({
        data: { vehicleId, ...recordColumns(input), lineItems: { create: lineItemRows(input) } },
        include: lineItemsInOrder,
      });
    });
    return toRecordDto(row);
  }

  /** 404 for a vehicle of another Owner too, so ids cannot be probed. */
  private async assertOwnVehicle(ownerId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, ownerId }, select: { id: true } });
    if (vehicle === null) throw vehicleNotFound();
  }
}

/**
 * Locks the vehicle and checks a reading against all others (ADR-0007). The
 * lock serializes writes per vehicle so two saves cannot each pass alone and
 * together leave an incoherent log.
 */
export async function assertOdometerConsistent(
  tx: Prisma.TransactionClient,
  ownerId: string,
  vehicleId: string,
  candidate: { id?: string; date: string; odometer: number | null },
): Promise<void> {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM vehicles WHERE id = ${vehicleId}::uuid AND owner_id = ${ownerId}::uuid FOR UPDATE`;
  if (locked.length === 0) throw vehicleNotFound();
  if (candidate.odometer === null) return;
  const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  const records = await tx.serviceRecord.findMany({
    where: { vehicleId, odometer: { not: null } },
    select: { id: true, date: true, odometer: true },
  });
  const check = checkOdometerConsistency(
    { initialOdometer: vehicle.initialOdometer, initialOdometerDate: toIsoDate(vehicle.initialOdometerDate) },
    records.map((record) => ({ id: record.id, date: toIsoDate(record.date), odometer: record.odometer })),
    candidate,
  );
  if (!check.ok) {
    throw new DomainError(422, 'ODOMETER_INCONSISTENT', check.message, { conflict: check.conflict });
  }
}
