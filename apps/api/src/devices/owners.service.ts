import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';

export type ResolvedDevice = { ownerId: string; deviceId: string; created: boolean };

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async findDevice(deviceIdHash: string): Promise<ResolvedDevice | null> {
    const existing = await this.prisma.device.findUnique({ where: { deviceIdHash } });
    return existing === null ? null : { ownerId: existing.ownerId, deviceId: existing.id, created: false };
  }

  /**
   * Creates a new Owner and Device on first sight of a Device ID (ADR-0001).
   * Two first requests racing each other converge on the same Owner thanks to
   * the unique hash.
   */
  async createOwnerWithDevice(deviceIdHash: string): Promise<ResolvedDevice> {
    try {
      const device = await this.prisma.device.create({
        data: { deviceIdHash, owner: { create: {} } },
      });
      return { ownerId: device.ownerId, deviceId: device.id, created: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const winner = await this.prisma.device.findUniqueOrThrow({ where: { deviceIdHash } });
        return { ownerId: winner.ownerId, deviceId: winner.id, created: false };
      }
      throw error;
    }
  }
}
