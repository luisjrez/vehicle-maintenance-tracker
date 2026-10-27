import { type CreateRecordInput, type CreateVehicleInput, todayIsoDate } from '@vmt/shared';

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

export function recordInput(overrides: Partial<CreateRecordInput> = {}): CreateRecordInput {
  return {
    date: '2026-03-04',
    totalCents: 18_900,
    lineItems: [{ serviceSlug: 'oil-change' }],
    ...overrides,
  };
}
