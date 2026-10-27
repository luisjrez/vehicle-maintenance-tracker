import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { type CreateVehicle, createVehicleSchema, type UpdateVehicle, updateVehicleSchema, type Vehicle } from '@vmt/shared';
import { idParamSchema } from '../common/id-param.js';
import { CurrentOwner } from '../devices/current-owner.decorator.js';
import type { OwnerContext } from '../devices/owner-context.js';
import { VehiclesService } from './vehicles.service.js';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  list(@CurrentOwner() owner: OwnerContext): Promise<Vehicle[]> {
    return this.vehicles.list(owner.ownerId);
  }

  @Post()
  create(
    @CurrentOwner() owner: OwnerContext,
    @Body({ schema: createVehicleSchema }) input: CreateVehicle,
  ): Promise<Vehicle> {
    return this.vehicles.create(owner.ownerId, input);
  }

  @Get(':vehicleId')
  get(
    @CurrentOwner() owner: OwnerContext,
    @Param('vehicleId', { schema: idParamSchema }) vehicleId: string,
  ): Promise<Vehicle> {
    return this.vehicles.get(owner.ownerId, vehicleId);
  }

  @Patch(':vehicleId')
  update(
    @CurrentOwner() owner: OwnerContext,
    @Param('vehicleId', { schema: idParamSchema }) vehicleId: string,
    @Body({ schema: updateVehicleSchema }) input: UpdateVehicle,
  ): Promise<Vehicle> {
    return this.vehicles.update(owner.ownerId, vehicleId, input);
  }

  @Delete(':vehicleId')
  @HttpCode(204)
  remove(
    @CurrentOwner() owner: OwnerContext,
    @Param('vehicleId', { schema: idParamSchema }) vehicleId: string,
  ): Promise<void> {
    return this.vehicles.remove(owner.ownerId, vehicleId);
  }
}
