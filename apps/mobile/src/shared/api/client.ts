import Constants from 'expo-constants';
import type { z } from 'zod';
import { DEVICE_ID_HEADER } from '@vmt/shared';
import { getDeviceId } from '../device/device-id';
import { resolveApiBaseUrl } from './base-url';
import { ApiError, parseErrorBody } from './api-error';

export const apiBaseUrl = resolveApiBaseUrl({
  configuredUrl: process.env.EXPO_PUBLIC_API_URL,
  metroHostUri: Constants.expoConfig?.hostUri,
});

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

/**
 * Calls the API and validates the response with the shared Zod schema, so the
 * app never trusts a payload shape it did not check.
 */
export async function apiRequest<T>(path: string, schema: z.ZodType<T>, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    const deviceId = await getDeviceId();
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        [DEVICE_ID_HEADER]: deviceId,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError({ kind: 'network' });
  }

  const payload: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError({ kind: 'http', status: response.status, ...parseErrorBody(payload) });
  }
  return schema.parse(payload);
}
