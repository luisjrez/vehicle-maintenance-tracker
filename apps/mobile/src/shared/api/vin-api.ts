import { API_VERSION, type VinDecodeResponse, vinDecodeResponseSchema } from '@vmt/shared';
import { apiRequest } from './client';

export function decodeVin(vin: string): Promise<VinDecodeResponse> {
  return apiRequest(`/${API_VERSION}/vin/${encodeURIComponent(vin)}`, vinDecodeResponseSchema);
}
