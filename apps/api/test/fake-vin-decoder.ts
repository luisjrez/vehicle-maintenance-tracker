import { readFileSync } from 'node:fs';
import { VinDecoder } from '../src/vin/vin-decoder.port.js';

/** Replays recorded vPIC responses; `outage` simulates vPIC being down. */
export class FakeVinDecoder extends VinDecoder {
  outage = false;
  readonly calls: string[] = [];

  fetchDecode(vin: string): Promise<unknown> {
    this.calls.push(vin);
    if (this.outage) return Promise.resolve(null);
    try {
      return Promise.resolve(JSON.parse(readFileSync(new URL(`./fixtures/vpic/${vin}.json`, import.meta.url), 'utf8')));
    } catch {
      return Promise.resolve({ Count: 1, Results: [{ ErrorCode: '8', Make: '', Model: '', ModelYear: '' }] });
    }
  }
}
