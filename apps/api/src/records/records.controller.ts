import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { type CreateRecord, createRecordSchema, type ServiceRecord } from '@vmt/shared';
import { idParamSchema } from '../common/id-param.js';
import { CurrentOwner } from '../devices/current-owner.decorator.js';
import type { OwnerContext } from '../devices/owner-context.js';
import { RecordsService } from './records.service.js';

@Controller('vehicles/:vehicleId/records')
export class VehicleRecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  list(
    @CurrentOwner() owner: OwnerContext,
    @Param('vehicleId', { schema: idParamSchema }) vehicleId: string,
  ): Promise<ServiceRecord[]> {
    return this.records.listForVehicle(owner.ownerId, vehicleId);
  }

  @Post()
  create(
    @CurrentOwner() owner: OwnerContext,
    @Param('vehicleId', { schema: idParamSchema }) vehicleId: string,
    @Body({ schema: createRecordSchema }) input: CreateRecord,
  ): Promise<ServiceRecord> {
    return this.records.create(owner.ownerId, vehicleId, input);
  }
}

/** Every record of the Owner in one call, so the app can refresh its mirror cheaply. */
@Controller('records')
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  list(@CurrentOwner() owner: OwnerContext): Promise<ServiceRecord[]> {
    return this.records.listForOwner(owner.ownerId);
  }
}
