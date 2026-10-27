import { createDeviceIdProvider, type DeviceIdSources } from './device-id-provider';

function keychainWith(initial: string | null) {
  let stored = initial;
  return {
    read: jest.fn(() => Promise.resolve(stored)),
    write: jest.fn((value: string) => {
      stored = value;
      return Promise.resolve();
    }),
  };
}

function sources(overrides: Partial<DeviceIdSources>): DeviceIdSources {
  return {
    platform: 'ios',
    androidId: () => null,
    keychain: keychainWith(null),
    randomUUID: () => '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    ...overrides,
  };
}

describe('createDeviceIdProvider', () => {
  it('uses ANDROID_ID on Android', async () => {
    const getDeviceId = createDeviceIdProvider(sources({ platform: 'android', androidId: () => '9b1deb4d3b7d4bad' }));

    await expect(getDeviceId()).resolves.toBe('9b1deb4d3b7d4bad');
  });

  it('reuses the UUID already in the iOS Keychain, so a reinstall keeps the same Owner', async () => {
    const keychain = keychainWith('11111111-2222-4333-8444-555555555555');
    const getDeviceId = createDeviceIdProvider(sources({ keychain }));

    await expect(getDeviceId()).resolves.toBe('11111111-2222-4333-8444-555555555555');
    expect(keychain.write).not.toHaveBeenCalled();
  });

  it('creates and persists a UUID on the first iOS launch', async () => {
    const keychain = keychainWith(null);
    const getDeviceId = createDeviceIdProvider(sources({ keychain }));

    await expect(getDeviceId()).resolves.toBe('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
    expect(keychain.write).toHaveBeenCalledWith('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
  });

  it('reads the Keychain once even when many requests start together', async () => {
    const keychain = keychainWith(null);
    const getDeviceId = createDeviceIdProvider(sources({ keychain }));

    await Promise.all([getDeviceId(), getDeviceId(), getDeviceId()]);

    expect(keychain.read).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed Keychain read instead of caching the failure', async () => {
    const keychain = keychainWith('11111111-2222-4333-8444-555555555555');
    keychain.read.mockRejectedValueOnce(new Error('locked'));
    const getDeviceId = createDeviceIdProvider(sources({ keychain }));

    await expect(getDeviceId()).rejects.toThrow('locked');
    await expect(getDeviceId()).resolves.toBe('11111111-2222-4333-8444-555555555555');
  });
});
