import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { type IssuedTransferCode, type RedeemedTransfer, type RedeemTransfer, redeemTransferSchema } from '@vmt/shared';
import { CurrentOwner } from '../devices/current-owner.decorator.js';
import type { OwnerContext } from '../devices/owner-context.js';
import { TransferService } from './transfer.service.js';

@Controller('transfer-codes')
export class TransferController {
  constructor(private readonly transfer: TransferService) {}

  @Post()
  issue(@CurrentOwner() owner: OwnerContext): Promise<IssuedTransferCode> {
    return this.transfer.issue(owner.ownerId);
  }

  @Post('redeem')
  @HttpCode(200)
  redeem(
    @CurrentOwner() owner: OwnerContext,
    @Body({ schema: redeemTransferSchema }) input: RedeemTransfer,
  ): Promise<RedeemedTransfer> {
    return this.transfer.redeem(owner, input);
  }
}
