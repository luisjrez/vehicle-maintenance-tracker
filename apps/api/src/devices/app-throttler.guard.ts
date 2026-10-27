import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import { DEVICE_ID_HEADER } from '@vmt/shared';
import { DomainError } from '../common/domain-error.js';
import { parseDeviceId } from './device-id.js';

/**
 * Rate limits per Device ID, falling back to the client IP when there is none
 * (ADR-0009). The tracker is a hash so raw Device IDs never sit in the limiter's
 * storage.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Record<string, unknown>): Promise<string> {
    const headers = request['headers'];
    const header = typeof headers === 'object' && headers !== null ? Reflect.get(headers, DEVICE_ID_HEADER) : undefined;
    const deviceId = parseDeviceId(header);
    if (deviceId !== null) {
      return Promise.resolve(`device:${createHash('sha256').update(deviceId).digest('hex')}`);
    }
    const ip = request['ip'];
    return Promise.resolve(`ip:${typeof ip === 'string' ? ip : 'unknown'}`);
  }

  protected override throwThrottlingException(): Promise<void> {
    throw new DomainError(429, 'RATE_LIMITED', 'Too many requests. Please wait a moment and try again.');
  }
}
