import { normalizeVin, VIN_ALPHABET, VIN_LENGTH, validateVin } from '@vmt/shared';

export type VinFeedback =
  | { state: 'empty' }
  | { state: 'typing'; message: string }
  | { state: 'invalid'; message: string }
  | { state: 'valid'; vin: string };

/** Live feedback while the Owner types: errors show as soon as they are certain, not before. */
export function vinFeedback(input: string): VinFeedback {
  const vin = normalizeVin(input);
  if (vin === '') return { state: 'empty' };
  if (!VIN_ALPHABET.test(vin)) {
    return { state: 'invalid', message: 'A VIN uses only letters and digits, and never I, O or Q.' };
  }
  if (vin.length < VIN_LENGTH) return { state: 'typing', message: `${vin.length}/${VIN_LENGTH} characters` };
  const result = validateVin(vin);
  return result.ok ? { state: 'valid', vin: result.vin } : { state: 'invalid', message: result.message };
}
