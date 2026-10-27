import { API_VERSION, type OwnerSummary, ownerSummarySchema } from '@vmt/shared';
import { apiRequest } from './client';

export function fetchOwner(): Promise<OwnerSummary> {
  return apiRequest(`/${API_VERSION}/owner`, ownerSummarySchema);
}
