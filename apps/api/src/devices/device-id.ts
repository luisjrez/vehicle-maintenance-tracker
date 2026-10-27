import { createHmac } from 'node:crypto';

// iOS: random UUID kept in the Keychain. Android: ANDROID_ID, 64 bits as 16 hex digits.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ANDROID_ID = /^[0-9a-f]{16}$/;
const ALL_ZEROS = /^0+$/;

/** Returns the normalized Device ID, or null when the header is missing or malformed. */
export function parseDeviceId(header: unknown): string | null {
  if (typeof header !== 'string') return null;
  const value = header.trim().toLowerCase();
  if (!UUID.test(value) && !ANDROID_ID.test(value)) return null;
  return ALL_ZEROS.test(value.replaceAll('-', '')) ? null : value;
}

/**
 * Keyed hash (HMAC-SHA256) so a database leak alone cannot be used to look up
 * or replay Device IDs. Rotating the secret orphans every Owner.
 */
export function hashDeviceId(deviceId: string, secret: string): string {
  return createHmac('sha256', secret).update(deviceId).digest('hex');
}
