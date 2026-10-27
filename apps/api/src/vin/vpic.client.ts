import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { VinDecoder } from './vin-decoder.port.js';

const RETRY_DELAY_MS = 300;

/** NHTSA vPIC `DecodeVinValues`: free and keyless, best-effort uptime. One retry on transport failures. */
@Injectable()
export class VpicClient extends VinDecoder {
  private readonly logger = new Logger(VpicClient.name);

  constructor(@Inject(ENV) private readonly env: Env) {
    super();
  }

  async fetchDecode(vin: string): Promise<unknown> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const result = await this.attempt(vin);
      if (result.ok) return result.payload;
      if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
    return null;
  }

  private async attempt(vin: string): Promise<{ ok: true; payload: unknown } | { ok: false }> {
    const url = `${this.env.VPIC_BASE_URL}/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(this.env.VPIC_TIMEOUT_MS) });
      if (!response.ok) {
        this.logger.warn(`vPIC answered ${response.status}`);
        return { ok: false };
      }
      const payload: unknown = await response.json();
      return { ok: true, payload };
    } catch (error) {
      this.logger.warn(`vPIC unreachable: ${error instanceof Error ? error.name : 'unknown error'}`);
      return { ok: false };
    }
  }
}
