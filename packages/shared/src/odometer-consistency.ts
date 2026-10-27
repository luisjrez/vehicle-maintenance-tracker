// ADR-0007: readings never go backwards in time. A reading must be ≥ the highest
// reading dated before it and ≤ the lowest reading dated after it; readings on the
// same day do not constrain each other. The initial odometer is a reading on the
// vehicle's creation date, and records without an odometer are skipped.

type VehicleReading = { initialOdometer: number; initialOdometerDate: string };
type RecordReading = { id: string; date: string; odometer: number | null };
type Candidate = { id?: string; date: string; odometer: number | null };

type Reading = { date: string; odometer: number; source: 'initial' | 'record'; recordId: string | null };

export type OdometerConflict = {
  side: 'before' | 'after';
  odometer: number;
  date: string;
  source: 'initial' | 'record';
  recordId: string | null;
};

export type OdometerCheck = { ok: true } | { ok: false; conflict: OdometerConflict; message: string };

const miles = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function readings(
  vehicle: VehicleReading,
  records: readonly RecordReading[],
  excludeId: string | undefined,
  includeInitial = true,
): Reading[] {
  const fromRecords = records.flatMap((record): Reading[] =>
    record.odometer === null || record.id === excludeId
      ? []
      : [{ date: record.date, odometer: record.odometer, source: 'record', recordId: record.id }],
  );
  if (!includeInitial) return fromRecords;
  return [
    { date: vehicle.initialOdometerDate, odometer: vehicle.initialOdometer, source: 'initial', recordId: null },
    ...fromRecords,
  ];
}

function neighbours(all: readonly Reading[], date: string): { before: Reading | undefined; after: Reading | undefined } {
  let before: Reading | undefined;
  let after: Reading | undefined;
  for (const reading of all) {
    if (reading.date < date && (before === undefined || reading.odometer > before.odometer)) before = reading;
    if (reading.date > date && (after === undefined || reading.odometer < after.odometer)) after = reading;
  }
  return { before, after };
}

function describe(conflict: OdometerConflict): string {
  const limit = conflict.side === 'before' ? 'lower' : 'higher';
  const when = `${day.format(new Date(`${conflict.date}T00:00:00Z`))}${conflict.source === 'initial' ? ' when you added this vehicle' : ''}`;
  return `The odometer can’t be ${limit} than ${miles.format(conflict.odometer)} mi, recorded on ${when}.`;
}

export function checkOdometerConsistency(
  vehicle: VehicleReading,
  records: readonly RecordReading[],
  candidate: Candidate,
): OdometerCheck {
  return check(readings(vehicle, records, candidate.id), candidate);
}

/** Editing the initial odometer re-checks it, as a reading on the creation date, against the records. */
export function checkInitialOdometerEdit(
  vehicle: VehicleReading,
  records: readonly RecordReading[],
  initialOdometer: number,
): OdometerCheck {
  return check(readings(vehicle, records, undefined, false), { date: vehicle.initialOdometerDate, odometer: initialOdometer });
}

function check(all: readonly Reading[], candidate: Candidate): OdometerCheck {
  if (candidate.odometer === null) return { ok: true };
  const { before, after } = neighbours(all, candidate.date);
  const offending =
    before !== undefined && candidate.odometer < before.odometer
      ? { side: 'before' as const, reading: before }
      : after !== undefined && candidate.odometer > after.odometer
        ? { side: 'after' as const, reading: after }
        : undefined;
  if (offending === undefined) return { ok: true };
  const conflict: OdometerConflict = {
    side: offending.side,
    odometer: offending.reading.odometer,
    date: offending.reading.date,
    source: offending.reading.source,
    recordId: offending.reading.recordId,
  };
  return { ok: false, conflict, message: describe(conflict) };
}

/** The range a reading on `date` may take; `max` is null when nothing is dated after it. */
export function odometerBounds(
  vehicle: VehicleReading,
  records: readonly RecordReading[],
  date: string,
  excludeId?: string,
): { min: number; max: number | null } {
  const { before, after } = neighbours(readings(vehicle, records, excludeId), date);
  return { min: before?.odometer ?? 0, max: after?.odometer ?? null };
}
