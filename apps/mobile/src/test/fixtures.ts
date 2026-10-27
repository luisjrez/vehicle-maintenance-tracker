import type { Vehicle } from '@vmt/shared';

let sequence = 0;

export function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  sequence += 1;
  return {
    id: `vehicle-${sequence}`,
    vin: null,
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    bodyClass: null,
    vehicleType: null,
    fuelType: null,
    electrification: null,
    cylinders: null,
    displacementL: null,
    driveType: null,
    nickname: null,
    plate: '7ABC123',
    plateState: 'CA',
    color: null,
    initialOdometer: 47_750,
    initialOdometerDate: '2026-01-10',
    createdAt: '2026-01-10T12:00:00.000Z',
    updatedAt: '2026-01-10T12:00:00.000Z',
    ...overrides,
  };
}
