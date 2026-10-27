import { Injectable } from '@nestjs/common';
import { type CreateVehicle, daysBetween, MAX_VEHICLES_PER_OWNER, type Vehicle } from '@vmt/shared';
import { DomainError } from '../common/domain-error.js';
import { Prisma } from '../generated/prisma/client.js';
import { fromIsoDate, serverToday } from '../common/dates.js';
import { PrismaService } from '../database/prisma.service.js';
import { toVehicleDto } from './vehicle.mapper.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string): Promise<Vehicle[]> {
    const rows = await this.prisma.vehicle.findMany({ where: { ownerId }, orderBy: { createdAt: 'asc' } });
    return rows.map(toVehicleDto);
  }

  async create(ownerId: string, input: CreateVehicle): Promise<Vehicle> {
    // The phone stamps its local date; anything further than a day from ours is a bad clock or a forged request.
    if (Math.abs(daysBetween(serverToday(), input.initialOdometerDate)) > 1) {
      throw new DomainError(400, 'INVALID_DATE', "The vehicle's start date must be today.");
    }
    const row = await this.prisma
      .$transaction(async (tx) => {
      // Lock the Owner so two concurrent creates cannot both pass the cap check.
      await tx.$queryRaw`SELECT id FROM owners WHERE id = ${ownerId}::uuid FOR UPDATE`;
      const count = await tx.vehicle.count({ where: { ownerId } });
      if (count >= MAX_VEHICLES_PER_OWNER) {
        throw new DomainError(
          409,
          'VEHICLE_LIMIT_REACHED',
          `You can have up to ${MAX_VEHICLES_PER_OWNER} vehicles. Delete one to add another.`,
        );
      }
      return tx.vehicle.create({
        data: {
          ownerId,
          vin: input.vin ?? null,
          year: input.year,
          make: input.make,
          model: input.model,
          trim: input.trim ?? null,
          bodyClass: input.bodyClass ?? null,
          vehicleType: input.vehicleType ?? null,
          fuelType: input.fuelType ?? null,
          electrification: input.electrification ?? null,
          cylinders: input.cylinders ?? null,
          displacementL: input.displacementL ?? null,
          driveType: input.driveType ?? null,
          nickname: input.nickname ?? null,
          plate: input.plate ?? null,
          plateState: input.plateState ?? null,
          color: input.color ?? null,
          initialOdometer: input.initialOdometer,
          initialOdometerDate: fromIsoDate(input.initialOdometerDate),
        },
      });
      })
      .catch(rethrowDuplicateVin);
    return toVehicleDto(row);
  }
}

/** VIN is unique per Owner (ADR-0003); the database constraint is the authority. */
export function rethrowDuplicateVin(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new DomainError(409, 'DUPLICATE_VIN', 'This vehicle is already in your garage.');
  }
  throw error;
}
