import {
  addOdometerReading,
  addVinReading,
  correctVinReading,
  emptyOdometerVote,
  emptyVinVote,
  normalizeBarcodeVin,
  type OdometerCandidate,
  odometerLock,
  type OdometerVote,
  pickOdometerCandidates,
  vinConsensus,
  vinReadingsFromText,
  type VinVote,
} from '@vmt/shared';
import type { ScanContext, ScanFrame } from '@/shared/scanner/scan-types';

/** What the scanner can propose to the Owner. */
export type ScanProposal =
  | { kind: 'vin'; vin: string }
  | { kind: 'miles'; miles: number }
  | { kind: 'km'; km: number }
  | { kind: 'choice'; options: number[] };

/** Corrected VIN readings in a frame's text, most likely first. */
function vinReadings(frame: ScanFrame): string[] {
  const texts = [...frame.lines.map((line) => line.text), frame.lines.map((line) => line.text).join(' ')];
  return [...new Set(texts.flatMap(vinReadingsFromText).flatMap(correctVinReading))];
}

/** The door-jamb barcode wins outright when it carries a valid VIN. */
function barcodeVin(frame: ScanFrame): string | null {
  for (const barcode of frame.barcodes) {
    const vin = normalizeBarcodeVin(barcode.value);
    if (vin !== null) return vin;
  }
  return null;
}

export type VinScanState = { vote: VinVote };
export const initialVinScan = (): VinScanState => ({ vote: emptyVinVote() });

export function interpretVinFrame(state: VinScanState, frame: ScanFrame): { state: VinScanState; proposal: ScanProposal | null } {
  const fromBarcode = barcodeVin(frame);
  if (fromBarcode !== null) return { state, proposal: { kind: 'vin', vin: fromBarcode } };
  // One reading per frame, so a frame that happens to show the VIN twice does not outvote others.
  const [reading] = vinReadings(frame);
  if (reading === undefined) return { state, proposal: null };
  const vote = addVinReading(state.vote, reading);
  const consensus = vinConsensus(vote);
  return { state: { vote }, proposal: consensus === null ? null : { kind: 'vin', vin: consensus.vin } };
}

export type OdometerScanState = { vote: OdometerVote; units: ReadonlyMap<number, OdometerCandidate['unit']> };
export const initialOdometerScan = (): OdometerScanState => ({ vote: emptyOdometerVote(), units: new Map() });

function proposalFor(miles: number, unit: OdometerCandidate['unit']): ScanProposal {
  return unit === 'km' ? { kind: 'km', km: miles } : { kind: 'miles', miles };
}

export function interpretOdometerFrame(
  state: OdometerScanState,
  frame: ScanFrame,
  now: number,
  context: ScanContext,
): { state: OdometerScanState; proposal: ScanProposal | null } {
  const [best] = pickOdometerCandidates(frame.lines, { bounds: context.odometerBounds });
  const units = best === undefined ? state.units : new Map(state.units).set(best.miles, best.unit);
  const vote = addOdometerReading(state.vote, best?.miles ?? null, now);
  const lock = odometerLock(vote, now);
  const next = { vote, units };
  if (lock === null) return { state: next, proposal: null };
  if (lock.kind === 'choice') return { state: next, proposal: { kind: 'choice', options: lock.options } };
  return { state: next, proposal: proposalFor(lock.miles, units.get(lock.miles) ?? null) };
}

/** The shutter fallback: one still, no voting, best guess (or both when two tie). */
export function interpretStill(mode: 'vin' | 'odometer', frame: ScanFrame, context: ScanContext): ScanProposal | null {
  if (mode === 'vin') {
    const vin = barcodeVin(frame) ?? vinReadings(frame)[0];
    return vin === undefined ? null : { kind: 'vin', vin };
  }
  const [first, second] = pickOdometerCandidates(frame.lines, { bounds: context.odometerBounds });
  if (first === undefined) return null;
  if (second !== undefined && second.score === first.score) return { kind: 'choice', options: [first.miles, second.miles] };
  return proposalFor(first.miles, first.unit);
}
