import { Controller, Get } from '@nestjs/common';
import type { OwnerSummary } from '@vmt/shared';
import { PrismaService } from '../database/prisma.service.js';
import { CurrentOwner } from './current-owner.decorator.js';
import type { OwnerContext } from './owner-context.js';

@Controller('owner')
export class OwnerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async summary(@CurrentOwner() owner: OwnerContext): Promise<OwnerSummary> {
    const row = await this.prisma.owner.findUniqueOrThrow({
      where: { id: owner.ownerId },
      include: { _count: { select: { vehicles: true } } },
    });
    return { createdAt: row.createdAt.toISOString(), vehicleCount: row._count.vehicles };
  }
}
