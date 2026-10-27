import { Module } from '@nestjs/common';
import { RecordsController, VehicleRecordsController } from './records.controller.js';
import { RecordsService } from './records.service.js';

@Module({
  controllers: [VehicleRecordsController, RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
