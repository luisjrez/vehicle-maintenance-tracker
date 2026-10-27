import { checkOdometerConsistency, odometerBounds } from './odometer-consistency.js';

const vehicle = { initialOdometer: 40_000, initialOdometerDate: '2026-01-10' };
const records = [
  { id: 'r1', date: '2025-06-01', odometer: 30_000 },
  { id: 'r2', date: '2026-03-01', odometer: 45_000 },
  { id: 'r3', date: '2026-05-01', odometer: null },
  { id: 'r4', date: '2026-08-01', odometer: 52_000 },
];

describe('checkOdometerConsistency', () => {
  it('accepts a reading between its neighbours by date', () => {
    expect(checkOdometerConsistency(vehicle, records, { date: '2026-04-15', odometer: 48_000 })).toEqual({ ok: true });
  });

  it('accepts a backfilled record dated before the vehicle was added', () => {
    expect(checkOdometerConsistency(vehicle, records, { date: '2025-09-01', odometer: 35_000 })).toEqual({ ok: true });
  });

  it('rejects a reading lower than the highest one dated before it, naming that reading', () => {
    const result = checkOdometerConsistency(vehicle, records, { date: '2026-04-15', odometer: 44_000 });

    expect(result).toMatchObject({ ok: false, conflict: { side: 'before', odometer: 45_000, date: '2026-03-01', recordId: 'r2' } });
    expect(result.ok ? '' : result.message).toBe(
      'The odometer can’t be lower than 45,000 mi, recorded on Mar 1, 2026.',
    );
  });

  it('rejects a reading higher than the lowest one dated after it', () => {
    const result = checkOdometerConsistency(vehicle, records, { date: '2025-09-01', odometer: 41_000 });

    expect(result).toMatchObject({ ok: false, conflict: { side: 'after', odometer: 40_000, source: 'initial' } });
    expect(result.ok ? '' : result.message).toBe(
      'The odometer can’t be higher than 40,000 mi, recorded on Jan 10, 2026 when you added this vehicle.',
    );
  });

  it('treats the initial odometer as a reading on the creation date', () => {
    expect(checkOdometerConsistency(vehicle, [], { date: '2026-02-01', odometer: 39_999 }).ok).toBe(false);
    expect(checkOdometerConsistency(vehicle, [], { date: '2026-02-01', odometer: 40_000 }).ok).toBe(true);
  });

  it('allows equal readings and any reading on the same day as another', () => {
    expect(checkOdometerConsistency(vehicle, records, { date: '2026-04-15', odometer: 45_000 }).ok).toBe(true);
    expect(checkOdometerConsistency(vehicle, records, { date: '2026-03-01', odometer: 44_000 }).ok).toBe(true);
    expect(checkOdometerConsistency(vehicle, [], { date: '2026-01-10', odometer: 39_000 }).ok).toBe(true);
  });

  it('skips records without an odometer, and records without one are always fine', () => {
    expect(checkOdometerConsistency(vehicle, records, { date: '2026-05-01', odometer: 46_000 }).ok).toBe(true);
    expect(checkOdometerConsistency(vehicle, records, { date: '2026-04-15', odometer: null }).ok).toBe(true);
  });

  it('excludes the record being edited from its own neighbours', () => {
    expect(checkOdometerConsistency(vehicle, records, { id: 'r2', date: '2026-03-01', odometer: 41_000 }).ok).toBe(true);
    expect(checkOdometerConsistency(vehicle, records, { id: 'r4', date: '2026-02-01', odometer: 60_000 }).ok).toBe(false);
  });
});

describe('odometerBounds', () => {
  it('returns the plausible range for a date', () => {
    expect(odometerBounds(vehicle, records, '2026-04-15')).toEqual({ min: 45_000, max: 52_000 });
    expect(odometerBounds(vehicle, records, '2027-01-01')).toEqual({ min: 52_000, max: null });
  });
});
