import {
  API_VERSION,
  type IssuedTransferCode,
  issuedTransferCodeSchema,
  type RedeemedTransfer,
  redeemedTransferSchema,
  type RedeemTransferInput,
} from '@vmt/shared';
import { apiRequest } from './client';

export function issueTransferCode(): Promise<IssuedTransferCode> {
  return apiRequest(`/${API_VERSION}/transfer-codes`, issuedTransferCodeSchema, { method: 'POST', body: {} });
}

export function redeemTransferCode(input: RedeemTransferInput): Promise<RedeemedTransfer> {
  return apiRequest(`/${API_VERSION}/transfer-codes/redeem`, redeemedTransferSchema, { method: 'POST', body: input });
}
