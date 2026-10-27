// US-market VIN rules from 49 CFR 565 (see .scratch/.../research/vin-validation-and-decoding.md).

export const VIN_LENGTH = 17;
/** The VIN alphabet: digits and capitals except I, O and Q. */
export const VIN_ALPHABET = /^[A-HJ-NPR-Z0-9]+$/;

const TRANSLITERATION: Readonly<Record<string, number>> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2] as const;
/** Position-10 codes in cycle order; index 0 is 1980 (or 2010). U, Z and 0 are never used. */
const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

export type VinFailureReason = 'LENGTH' | 'INVALID_CHARACTERS' | 'INVALID_YEAR_CODE' | 'CHECK_DIGIT';

export type VinValidation = { ok: true; vin: string } | { ok: false; reason: VinFailureReason; message: string };

const MESSAGES: Record<VinFailureReason, string> = {
  LENGTH: 'A VIN has exactly 17 characters.',
  INVALID_CHARACTERS: 'A VIN uses only letters and digits, and never I, O or Q.',
  INVALID_YEAR_CODE: 'The 10th character is not a valid model-year code.',
  CHECK_DIGIT: "This VIN doesn't add up — check for typos such as 0 vs D, 8 vs B or 5 vs S.",
};

/** Removes whitespace and dashes people paste, then uppercases. */
export function normalizeVin(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

function characterValue(character: string): number {
  return /\d/.test(character) ? Number(character) : (TRANSLITERATION[character] ?? 0);
}

/** The position-9 check digit (`0`–`9` or `X`) for a 17-character VIN. */
export function computeCheckDigit(vin: string): string {
  let sum = 0;
  for (let index = 0; index < VIN_LENGTH; index += 1) {
    sum += characterValue(vin.charAt(index)) * (WEIGHTS[index] ?? 0);
  }
  const remainder = sum % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

const fail = (reason: VinFailureReason): VinValidation => ({ ok: false, reason, message: MESSAGES[reason] });

/** Strict validation: a failing check digit is a typo in practice, so it is rejected, not warned. */
export function validateVin(input: string): VinValidation {
  const vin = normalizeVin(input);
  if (vin.length !== VIN_LENGTH) return fail('LENGTH');
  if (!VIN_ALPHABET.test(vin)) return fail('INVALID_CHARACTERS');
  if (!YEAR_CODES.includes(vin.charAt(9))) return fail('INVALID_YEAR_CODE');
  if (computeCheckDigit(vin) !== vin.charAt(8)) return fail('CHECK_DIGIT');
  return { ok: true, vin };
}

export function isValidVin(input: string): boolean {
  return validateVin(input).ok;
}

/**
 * Model years a valid VIN can encode. Position 7 being a letter means the
 * 2010–2039 cycle for light vehicles; a digit leaves both cycles possible.
 */
export function modelYearCandidates(vin: string, currentYear: number): number[] {
  const index = YEAR_CODES.indexOf(vin.charAt(9));
  if (index < 0) return [];
  const older = 1980 + index;
  const newer = 2010 + index;
  const candidates = /[A-Z]/.test(vin.charAt(6)) ? [newer] : [older, newer];
  return candidates.filter((year) => year <= currentYear + 1);
}
