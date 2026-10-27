import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { DEVICE_ID_HEADER } from '@vmt/shared';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { DomainError } from '../common/domain-error.js';
import { IS_PUBLIC } from '../common/public.decorator.js';
import { hashDeviceId, parseDeviceId } from './device-id.js';
import { NewOwnerLimiter } from './new-owner-limiter.js';
import { OwnersService } from './owners.service.js';
import './owner-context.js';

/** Resolves the calling Owner from `X-Device-Id` for every non-public route. */
@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly owners: OwnersService,
    private readonly newOwners: NewOwnerLimiter,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const deviceId = parseDeviceId(request.headers[DEVICE_ID_HEADER]);
    if (deviceId === null) {
      throw new DomainError(401, 'INVALID_DEVICE_ID', 'A valid X-Device-Id header is required.');
    }
    const deviceIdHash = hashDeviceId(deviceId, this.env.DEVICE_ID_HASH_SECRET);
    let device = await this.owners.findDevice(deviceIdHash);
    if (device === null) {
      await this.newOwners.admit(request.ip ?? 'unknown');
      device = await this.owners.createOwnerWithDevice(deviceIdHash);
    }
    request.owner = { ownerId: device.ownerId, deviceId: device.deviceId };
    return true;
  }
}
