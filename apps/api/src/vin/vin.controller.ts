import { Controller, Get, Param } from '@nestjs/common';
import type { VinDecodeResponse } from '@vmt/shared';
import { VinDecodeRoute } from '../common/vin-decode-route.decorator.js';
import { VinDecodeService } from './vin-decode.service.js';

@Controller('vin')
export class VinController {
  constructor(private readonly vinDecode: VinDecodeService) {}

  @VinDecodeRoute()
  @Get(':vin')
  decode(@Param('vin') vin: string): Promise<VinDecodeResponse> {
    return this.vinDecode.decode(vin);
  }
}
