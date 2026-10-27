import { Injectable } from '@nestjs/common';
import {
  type DecodedVehicleDetails,
  decodedVehicleDetailsSchema,
  emptyDecodedDetails,
  modelYearCandidates,
  validateVin,
  type VinDecodeResponse,
} from '@vmt/shared';
import { DomainError } from '../common/domain-error.js';
import { PrismaService } from '../database/prisma.service.js';
import { VinDecoder } from './vin-decoder.port.js';
import { interpretVpicResponse } from './vpic-interpreter.js';

const NO_DATA_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours: makers submit vPIC data late.

@Injectable()
export class VinDecodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly decoder: VinDecoder,
  ) {}

  async decode(input: string, now: Date = new Date()): Promise<VinDecodeResponse> {
    const validation = validateVin(input);
    if (!validation.ok) throw new DomainError(400, 'INVALID_VIN', validation.message);
    const { vin } = validation;
    const candidates = modelYearCandidates(vin, now.getFullYear());

    const cached = await this.prisma.vinDecodeCache.findUnique({ where: { vin } });
    if (cached !== null && (cached.expiresAt === null || cached.expiresAt > now)) {
      return { vin, status: cached.status === 'decoded' ? 'decoded' : 'no_data', details: readDetails(cached.details), modelYearCandidates: candidates };
    }

    const payload = await this.decoder.fetchDecode(vin);
    if (payload === null) {
      // Outages are never cached: the next lookup tries vPIC again.
      return { vin, status: 'unavailable', details: emptyDecodedDetails, modelYearCandidates: candidates };
    }

    const { status, details } = interpretVpicResponse(payload);
    const expiresAt = status === 'decoded' ? null : new Date(now.getTime() + NO_DATA_TTL_MS);
    const jsonPayload = JSON.parse(JSON.stringify(payload));
    await this.prisma.vinDecodeCache.upsert({
      where: { vin },
      create: { vin, status, details, payload: jsonPayload, fetchedAt: now, expiresAt },
      update: { status, details, payload: jsonPayload, fetchedAt: now, expiresAt },
    });
    return { vin, status, details, modelYearCandidates: candidates };
  }
}

function readDetails(json: unknown): DecodedVehicleDetails {
  const parsed = decodedVehicleDetailsSchema.safeParse(json);
  return parsed.success ? parsed.data : emptyDecodedDetails;
}
