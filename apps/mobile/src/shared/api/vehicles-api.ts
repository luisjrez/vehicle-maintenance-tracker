import { z } from 'zod';
import {
  API_VERSION,
  type CreateVehicleInput,
  type UpdateVehicleInput,
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

export function updateVehicle(vehicleId: string, input: UpdateVehicleInput): Promise<Vehicle> {
  return apiRequest(`/${API_VERSION}/vehicles/${vehicleId}`, vehicleSchema, { method: 'PATCH', body: input });
}

export function deleteVehicle(vehicleId: string): Promise<void> {
  return apiRequest(`/${API_VERSION}/vehicles/${vehicleId}`, z.undefined(), { method: 'DELETE' });
}
