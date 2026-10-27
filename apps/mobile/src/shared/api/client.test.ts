import { z } from 'zod';
import { getDeviceId } from '@/shared/device/device-id';
import { ApiError } from './api-error';
import { apiRequest } from './client';

jest.mock('@/shared/device/device-id', () => ({ getDeviceId: jest.fn() }));

const getDeviceIdMock = jest.mocked(getDeviceId);

describe('apiRequest', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  afterEach(() => {
    fetchMock.mockReset();
    getDeviceIdMock.mockReset();
  });

  it('does not report a Keychain failure as being offline', async () => {
    getDeviceIdMock.mockRejectedValue(new Error('errSecMissingEntitlement'));

    const failure = await apiRequest('/v1/owner', z.unknown()).catch((error: unknown) => error);

    expect(failure).not.toBeInstanceOf(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a failed fetch as a network error', async () => {
    getDeviceIdMock.mockResolvedValue('9b1deb4d3b7d4bad');
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const failure = await apiRequest('/v1/owner', z.unknown()).catch((error: unknown) => error);

    expect(failure instanceof ApiError ? failure.failure.kind : null).toBe('network');
  });
});
