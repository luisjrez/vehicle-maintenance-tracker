import { Body, Controller, Get, Post } from '@nestjs/common';
import { type CreateVehicle, createVehicleSchema, type Vehicle } from '@vmt/shared';
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
}
