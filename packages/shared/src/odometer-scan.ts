// Picking the odometer value out of live OCR (odometer scanning decisions;
// research/odometer-scanning.md §3). Pure functions: frame text in, ranked
// candidates and a stability verdict out. The Owner always confirms.
import { ODOMETER_MAX } from './vehicle.js';

export type OdometerTextLine = { text: string; height: number };
export type OdometerCandidate = {
  miles: number;
  score: number;
  /** The unit printed next to the number, when there is one. */
  unit: 'mi' | 'km' | null;
  /** Inside the ADR-0007 bounds for the date being logged; out-of-bounds values are ranked low, not hidden. */
  inBounds: boolean;
};

// Labels that mean "this number is not the odometer".
const NEGATIVE = [/\bTRIP\b/, /\bKM\/H\b/, /\bMPH\b/, /°/, /\bRANGE\b/, /\bMPGE?\b/, /\bAVG\b/, /\b(AM|PM)\b/, /\d{1,2}:\d{2}/, /%/];
const ODO_LABEL = /\bODO(METER)?\b/;
const MILES_LABEL = /\bMI(LES)?\b/;
const KM_LABEL = /\bKM\b/;
// Characters OCR mistakes for digits, repaired only inside runs that hold a real digit.
const DIGITISH = /[0-9ODQISBZL|][0-9ODQISBZL|,]*(?:\.[0-9ODQISBZL|]+)?/g;
const TO_DIGIT: Readonly<Record<string, string>> = { O: '0', D: '0', Q: '0', I: '1', L: '1', '|': '1', S: '5', B: '8', Z: '2' };

const repair = (run: string) => run.split('').map((character) => TO_DIGIT[character] ?? character).join('');

function digitPrior(length: number): number {
  if (length >= 4 && length <= 6) return 2;
  return length === 7 ? 1 : 0;
}

type Options = { bounds?: { min: number; max: number | null } };

export function pickOdometerCandidates(lines: readonly OdometerTextLine[], options: Options = {}): OdometerCandidate[] {
  const tallest = Math.max(1, ...lines.map((line) => line.height));
  const best = new Map<number, OdometerCandidate>();
  const consider = (miles: number, score: number, unit: OdometerCandidate['unit']) => {
    if (miles > ODOMETER_MAX) return;
    const { bounds } = options;
    const inBounds = bounds === undefined || (miles >= bounds.min && (bounds.max === null || miles <= bounds.max));
    const final = inBounds ? score : score - 3;
    const existing = best.get(miles);
    if (existing === undefined || existing.score < final) best.set(miles, { miles, score: final, unit, inBounds });
  };

  for (const line of lines) {
    const text = line.text.toUpperCase();
    if (NEGATIVE.some((pattern) => pattern.test(text))) continue;
    const anchored = ODO_LABEL.test(text) || MILES_LABEL.test(text);
    const unit = KM_LABEL.test(text) ? 'km' : MILES_LABEL.test(text) ? 'mi' : null;
    for (const run of text.match(DIGITISH) ?? []) {
      if (!/\d/.test(run)) continue;
      const [integerPart = '', tenths] = repair(run).replaceAll(',', '').split('.');
      if (!/^\d{1,7}$/.test(integerPart)) continue;
      // A decimal is a strong trip-meter signal unless the line says ODO/mi; tenths are dropped either way.
      const score = (anchored ? 3 : 0) + digitPrior(integerPart.length) + 2 * (line.height / tallest) - (tenths !== undefined && !anchored ? 2 : 0);
      consider(Number(integerPart), score, unit);
      // A 7-digit drum is most likely 6 digits plus a tenths wheel: offer both, never guess.
      if (integerPart.length === 7 && tenths === undefined) consider(Number(integerPart.slice(0, 6)), score, unit);
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.miles - b.miles);
}

const WINDOW_MS = 1_500;
const MIN_FRAMES = 3;
const MIN_SHARE = 0.6;
const MAX_ENTRIES = 30;

export type OdometerVote = { readonly entries: ReadonlyArray<{ miles: number | null; at: number }> };
export type OdometerLock = { kind: 'single'; miles: number } | { kind: 'choice'; options: [number, number] };

export function emptyOdometerVote(): OdometerVote {
  return { entries: [] };
}

/** Records one processed frame's best candidate (or none) at time `at` in ms. */
export function addOdometerReading(vote: OdometerVote, miles: number | null, at: number): OdometerVote {
  return { entries: [...vote.entries, { miles, at }].slice(-MAX_ENTRIES) };
}

/**
 * Locks when one value wins ≥3 frames and ≥60 % of the last ~1.5 s. When the
 * runner-up is within one vote, both are offered instead of guessing.
 */
export function odometerLock(vote: OdometerVote, now: number): OdometerLock | null {
  const window = vote.entries.filter((entry) => entry.at >= now - WINDOW_MS);
  const counts = new Map<number, number>();
  for (const { miles } of window) if (miles !== null) counts.set(miles, (counts.get(miles) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const [winner, runnerUp] = ranked;
  if (winner === undefined || winner[1] < MIN_FRAMES) return null;
  const close = runnerUp !== undefined && runnerUp[1] >= winner[1] - 1;
  if (!close && winner[1] >= MIN_SHARE * window.length) return { kind: 'single', miles: winner[0] };
  if (close && winner[1] + runnerUp[1] >= MIN_SHARE * window.length) return { kind: 'choice', options: [winner[0], runnerUp[0]] };
  return null;
}

export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371);
}
