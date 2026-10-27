import { randomBytes, randomUUID } from 'node:crypto';

export function iosDeviceId(): string {
  return randomUUID().toUpperCase();
}

export function androidDeviceId(): string {
  return randomBytes(8).toString('hex');
}
