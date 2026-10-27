import { hashDeviceId, parseDeviceId } from './device-id.js';

describe('parseDeviceId', () => {
  it('accepts an iOS Keychain UUID and lowercases it', () => {
    expect(parseDeviceId('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
  });

  it('accepts a 16-hex-digit Android ANDROID_ID', () => {
    expect(parseDeviceId('9b1deb4d3b7d4bad')).toBe('9b1deb4d3b7d4bad');
  });

  it.each([undefined, '', 'not-a-device', '9b1deb4d3b7d4ba', '9b1deb4d3b7d4badz', ['9b1deb4d3b7d4bad']])(
    'rejects %j',
    (value) => {
      expect(parseDeviceId(value)).toBeNull();
    },
  );

  it('rejects the all-zero ANDROID_ID some emulators report', () => {
    expect(parseDeviceId('0000000000000000')).toBeNull();
  });
});

describe('hashDeviceId', () => {
  it('is deterministic per secret and never contains the raw id', () => {
    const id = '9b1deb4d3b7d4bad';
    const first = hashDeviceId(id, 'secret-a');

    expect(hashDeviceId(id, 'secret-a')).toBe(first);
    expect(hashDeviceId(id, 'secret-b')).not.toBe(first);
    expect(first).not.toContain(id);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });
});
