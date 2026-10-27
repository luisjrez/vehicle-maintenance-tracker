/** Raw vPIC JSON, or `null` when vPIC could not be reached (timeout, 5xx, 429, network). */
export abstract class VinDecoder {
  abstract fetchDecode(vin: string): Promise<unknown>;
}
