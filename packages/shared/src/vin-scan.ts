// Turning camera reads into a VIN (ADR-0006, VIN scanning decisions). Every
// candidate still passes the strict validator; the Owner confirms the result.
import { normalizeVin, VIN_ALPHABET, VIN_LENGTH, validateVin } from './vin.js';

/** Characters OCR confuses with each other; a swap is kept only if the check digit then passes. */
const AMBIGUOUS: Readonly<Record<string, string>> = { S: '5', '5': 'S', B: '8', '8': 'B', Z: '2', '2': 'Z', G: '6', '6': 'G', D: '0', '0': 'D' };
/** Letters seen where positions 13–17 must be digits (light vehicles). */
const AS_DIGIT: Readonly<Record<string, string>> = { S: '5', B: '8', Z: '2', G: '6', D: '0', O: '0', Q: '0', I: '1', L: '1', T: '7', A: '4' };
const SERIAL_START = 12;
const VOTE_WINDOW = 10;
const MIN_FRAMES = 3;
const MIN_AGREEMENT = 0.6;

/** Door-jamb barcodes sometimes prefix the VIN with an "I". Returns a valid VIN or null. */
export function normalizeBarcodeVin(raw: string): string | null {
  let value = normalizeVin(raw);
  if (value.length === VIN_LENGTH + 1 && value.startsWith('I')) value = value.slice(1);
  const result = validateVin(value);
  return result.ok ? result.vin : null;
}

/** Every 17-character window of letters and digits in a block of OCR text. */
export function vinReadingsFromText(text: string): string[] {
  const compact = text.toUpperCase().replace(/[\s\-*.:]/g, '');
  const readings = new Set<string>();
  for (const run of compact.match(/[A-Z0-9]{17,25}/g) ?? []) {
    for (let start = 0; start + VIN_LENGTH <= run.length; start += 1) readings.add(run.slice(start, start + VIN_LENGTH));
  }
  return [...readings];
}

/**
 * Valid VINs a raw 17-character read could be. I/O/Q never occur in a VIN, so
 * they become 1/0/0; positions 13–17 are digits; S/5, B/8, Z/2, G/6, D/0 swaps
 * are only kept when the check digit confirms them.
 */
export function correctVinReading(raw: string): string[] {
  const upper = raw.toUpperCase();
  if (upper.length !== VIN_LENGTH) return [];
  const characters = upper.replace(/I/g, '1').replace(/[OQ]/g, '0').split('');
  for (let index = SERIAL_START; index < VIN_LENGTH; index += 1) {
    const character = characters[index] ?? '';
    if (!/\d/.test(character)) characters[index] = AS_DIGIT[character] ?? character;
  }
  const base = characters.join('');
  if (!VIN_ALPHABET.test(base)) return [];
  if (validateVin(base).ok) return [base];

  const rescued = new Set<string>();
  for (let index = 0; index < SERIAL_START; index += 1) {
    const swap = AMBIGUOUS[base.charAt(index)];
    if (swap === undefined) continue;
    const candidate = `${base.slice(0, index)}${swap}${base.slice(index + 1)}`;
    if (validateVin(candidate).ok) rescued.add(candidate);
  }
  return [...rescued];
}

export type VinVote = { readonly readings: readonly string[] };

export function emptyVinVote(): VinVote {
  return { readings: [] };
}

/** Adds one frame's corrected reading, keeping only the latest frames. */
export function addVinReading(vote: VinVote, reading: string): VinVote {
  return { readings: [...vote.readings, reading].slice(-VOTE_WINDOW) };
}

/**
 * Per-character majority across recent frames. Locks once at least 3 frames
 * agree on every position at 60 % or more and the result is a valid VIN.
 */
export function vinConsensus(vote: VinVote): { vin: string; frames: number } | null {
  const { readings } = vote;
  if (readings.length < MIN_FRAMES) return null;
  let vin = '';
  for (let index = 0; index < VIN_LENGTH; index += 1) {
    const counts = new Map<string, number>();
    for (const reading of readings) counts.set(reading.charAt(index), (counts.get(reading.charAt(index)) ?? 0) + 1);
    let best = '';
    let bestCount = 0;
    for (const [character, count] of counts) {
      if (count > bestCount) {
        best = character;
        bestCount = count;
      }
    }
    if (bestCount / readings.length < MIN_AGREEMENT) return null;
    vin += best;
  }
  return validateVin(vin).ok ? { vin, frames: readings.length } : null;
}
