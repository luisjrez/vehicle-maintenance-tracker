// The Device ID comes from the Keychain / ANDROID_ID; tests use a fixed one.
jest.mock('@/shared/device/device-id', () => ({
  getDeviceId: () => Promise.resolve('3f2504e0-4f89-41d3-9a0c-0305e82c3301'),
}));

// Screens navigate through expo-router's imperative router; tests assert on this mock.
jest.mock('expo-router', () => ({
  ...jest.requireActual<object>('expo-router'),
  useRouter: () => jest.requireActual<typeof import('@/test/router-mock')>('@/test/router-mock').routerMock,
}));

// MMKV is a Nitro native module; tests persist to memory instead.
jest.mock('@/shared/store/mmkv-storage', () => {
  const memory = new Map<string, string>();
  return {
    mmkvStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  };
});
