import type { Vehicle } from '@vmt/shared';
import type { Vehicle as VehicleRow } from '../generated/prisma/client.js';
import { toIsoDate } from '../common/dates.js';

export function toVehicleDto(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    vin: row.vin,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    bodyClass: row.bodyClass,
    vehicleType: row.vehicleType,
    fuelType: row.fuelType,
    electrification: row.electrification,
    cylinders: row.cylinders,
    displacementL: row.displacementL === null ? null : row.displacementL.toNumber(),
    driveType: row.driveType,
    nickname: row.nickname,
    plate: row.plate,
    plateState: row.plateState,
    color: row.color,
    initialOdometer: row.initialOdometer,
    initialOdometerDate: toIsoDate(row.initialOdometerDate),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
