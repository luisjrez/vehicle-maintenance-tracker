// The Device ID comes from the Keychain / ANDROID_ID; tests use a fixed one.
jest.mock('@/shared/device/device-id', () => ({
  getDeviceId: () => Promise.resolve('3f2504e0-4f89-41d3-9a0c-0305e82c3301'),
}));
