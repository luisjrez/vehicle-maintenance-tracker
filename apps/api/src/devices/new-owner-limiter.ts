import { Inject, Injectable } from '@nestjs/common';
import { InjectThrottlerStorage, type ThrottlerStorage } from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { DomainError } from '../common/domain-error.js';

/**
 * Caps how many new Owners one client IP can create per window (ADR-0009).
 * It shares the throttler's storage, so moving that to Redis covers both.
 */
@Injectable()
export class NewOwnerLimiter {
  constructor(
    @InjectThrottlerStorage() private readonly storage: ThrottlerStorage,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async admit(ip: string): Promise<void> {
    // IPs are hashed so the limiter's memory never holds raw addresses.
    const key = `new-owner:${createHash('sha256').update(ip).digest('hex')}`;
    const { totalHits } = await this.storage.increment(
      key,
      this.env.THROTTLE_NEW_OWNERS_TTL_MS,
      this.env.THROTTLE_NEW_OWNERS_LIMIT,
      0,
      'new-owner',
    );
    if (totalHits > this.env.THROTTLE_NEW_OWNERS_LIMIT) {
      throw new DomainError(429, 'TOO_MANY_NEW_DEVICES', 'Too many new phones from this network. Please try again later.');
    }
  }
}
