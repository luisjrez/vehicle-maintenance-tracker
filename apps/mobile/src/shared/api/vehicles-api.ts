import {
  API_VERSION,
  type CreateVehicleInput,
  type Vehicle,
  vehicleListSchema,
  vehicleSchema,
} from '@vmt/shared';
import { apiRequest } from './client';

export function fetchVehicles(): Promise<Vehicle[]> {
  return apiRequest(`/${API_VERSION}/vehicles`, vehicleListSchema);
}

export function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  return apiRequest(`/${API_VERSION}/vehicles`, vehicleSchema, { method: 'POST', body: input });
}
