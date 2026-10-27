import { Injectable } from '@nestjs/common';
import {
  type IssuedTransferCode,
  type RedeemedTransfer,
  type RedeemTransfer,
  TRANSFER_CODE_TTL_MS,
} from '@vmt/shared';
import { createHash, randomBytes } from 'node:crypto';
import { DomainError } from '../common/domain-error.js';
import { PrismaService } from '../database/prisma.service.js';
import type { OwnerContext } from '../devices/owner-context.js';

// 256 random bits: unguessable, so a plain SHA-256 is enough to store it.
const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

const invalidCode = () =>
  new DomainError(410, 'TRANSFER_CODE_INVALID', 'This transfer code has expired or was already used. Generate a new one on your other phone.');

@Injectable()
export class TransferService {
  constructor(private readonly prisma: PrismaService) {}

  /** A new code for the calling Owner; any unused earlier code stops working. */
  async issue(ownerId: string, now: Date = new Date()): Promise<IssuedTransferCode> {
    const code = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + TRANSFER_CODE_TTL_MS);
    await this.prisma.$transaction([
      this.prisma.transferCode.deleteMany({ where: { ownerId, usedAt: null } }),
      this.prisma.transferCode.create({ data: { ownerId, codeHash: hashCode(code), expiresAt } }),
    ]);
    return { code, expiresAt: expiresAt.toISOString() };
  }

  /**
   * Moves the code's Owner to the calling Device and revokes the old phone: its
   * Device row is deleted, so its next request starts a fresh, empty Owner. Data
   * already on the calling phone is deleted, but only after explicit consent.
   */
  async redeem(caller: OwnerContext, input: RedeemTransfer, now: Date = new Date()): Promise<RedeemedTransfer> {
    return this.prisma.$transaction(async (tx) => {
      const found = await tx.$queryRaw<{ id: string; owner_id: string; expires_at: Date; used_at: Date | null }[]>`
        SELECT id, owner_id, expires_at, used_at FROM transfer_codes WHERE code_hash = ${hashCode(input.code)} FOR UPDATE`;
      const code = found[0];
      if (code === undefined || code.used_at !== null || code.expires_at <= now) throw invalidCode();
      if (code.owner_id === caller.ownerId) {
        throw new DomainError(400, 'TRANSFER_SAME_PHONE', 'Scan this code with your new phone, not the one showing it.');
      }

      const existing = await tx.vehicle.count({ where: { ownerId: caller.ownerId } });
      if (existing > 0 && !input.replaceExisting) {
        throw new DomainError(
          409,
          'TRANSFER_CONFLICT',
          `This phone has ${existing} ${existing === 1 ? 'vehicle' : 'vehicles'}; they will be deleted and replaced.`,
          { vehicleCount: existing },
        );
      }

      await tx.transferCode.update({ where: { id: code.id }, data: { usedAt: now } });
      await tx.device.deleteMany({ where: { ownerId: code.owner_id } });
      await tx.device.update({ where: { id: caller.deviceId }, data: { ownerId: code.owner_id } });
      // The calling phone's previous Owner now has no device; its data goes with it.
      await tx.owner.deleteMany({ where: { id: caller.ownerId, devices: { none: {} } } });
      return { vehicleCount: await tx.vehicle.count({ where: { ownerId: code.owner_id } }) };
    });
  }
}
