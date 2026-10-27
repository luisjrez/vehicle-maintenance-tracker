import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainErrorFilter } from './common/domain-error.filter.js';
import { RequestLoggerMiddleware } from './common/request-logger.middleware.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { HealthModule } from './health/health.module.js';
import { RecordsModule } from './records/records.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { VinModule } from './vin/vin.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, DevicesModule, HealthModule, VehiclesModule, RecordsModule, VinModule],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
