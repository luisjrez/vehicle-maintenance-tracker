import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { VIN_DECODE_ROUTE } from '../common/vin-decode-route.decorator.js';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { AppThrottlerGuard } from './app-throttler.guard.js';
import { DeviceGuard } from './device.guard.js';
import { NewOwnerLimiter } from './new-owner-limiter.js';
import { OwnerController } from './owner.controller.js';
import { OwnersService } from './owners.service.js';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        throttlers: [
          { name: 'device', limit: env.THROTTLE_DEVICE_LIMIT, ttl: env.THROTTLE_DEVICE_TTL_MS },
          {
            name: 'vin',
            limit: env.THROTTLE_VIN_LIMIT,
            ttl: env.THROTTLE_VIN_TTL_MS,
            skipIf: (context) => Reflect.getMetadata(VIN_DECODE_ROUTE, context.getHandler()) !== true,
          },
        ],
      }),
    }),
  ],
  controllers: [OwnerController],
  providers: [
    OwnersService,
    NewOwnerLimiter,
    // Guard order matters: throttle first, so a flood is rejected before it can create Owners.
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: DeviceGuard },
  ],
  exports: [OwnersService],
})
export class DevicesModule {}
