import { Module } from '@nestjs/common';
import { VinController } from './vin.controller.js';
import { VinDecodeService } from './vin-decode.service.js';
import { VinDecoder } from './vin-decoder.port.js';
import { VpicClient } from './vpic.client.js';

@Module({
  controllers: [VinController],
  providers: [VinDecodeService, { provide: VinDecoder, useClass: VpicClient }],
})
export class VinModule {}
