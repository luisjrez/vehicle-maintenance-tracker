import { z } from 'zod';
import {
  API_VERSION,
  type CreateRecordInput,
  type ServiceRecord,
  serviceRecordListSchema,
  serviceRecordSchema,
} from '@vmt/shared';
import { apiRequest } from './client';

export function fetchAllRecords(): Promise<ServiceRecord[]> {
  return apiRequest(`/${API_VERSION}/records`, serviceRecordListSchema);
}

export function createRecord(vehicleId: string, input: CreateRecordInput): Promise<ServiceRecord> {
  return apiRequest(`/${API_VERSION}/vehicles/${vehicleId}/records`, serviceRecordSchema, { method: 'POST', body: input });
}

export function updateRecord(recordId: string, input: CreateRecordInput): Promise<ServiceRecord> {
  return apiRequest(`/${API_VERSION}/records/${recordId}`, serviceRecordSchema, { method: 'PATCH', body: input });
}

export function deleteRecord(recordId: string): Promise<void> {
  return apiRequest(`/${API_VERSION}/records/${recordId}`, z.undefined(), { method: 'DELETE' });
}
