import { type CreateVehicleInput, todayIsoDate } from '@vmt/shared';

export function vehicleInput(overrides: Partial<CreateVehicleInput> = {}): CreateVehicleInput {
  return {
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    initialOdometer: 47_750,
    initialOdometerDate: todayIsoDate(),
    ...overrides,
  };
}
