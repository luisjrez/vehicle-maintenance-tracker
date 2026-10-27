import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../database/prisma.service.js';

describe('HealthController', () => {
  it('returns 503 when the database does not answer', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: () => Promise.reject(new Error('ECONNREFUSED')) } },
      ],
    }).compile();

    await expect(moduleRef.get(HealthController).check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
