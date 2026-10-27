import {
  checkOdometerConsistency,
  type CreateRecord,
  createRecordSchema,
  daysBetween,
  parseDollarsToCents,
  SCHEDULED_MAINTENANCE_SLUG,
  type ServiceRecord,
  todayIsoDate,
  type Vehicle,
} from '@vmt/shared';
import { parseInteger } from '@/shared/forms/field-errors';
import { strings } from '@/shared/strings';
import type { LogWorkDraft } from './log-work-draft';

/** Keyed by issue path: `totalCents`, `odometer`, `lineItems.0.costCents`… */
export type DraftErrors = Partial<Record<string, string>>;

/** Blank stays "not given"; anything typed that is not a number becomes NaN so the schema reports it. */
function optionalCents(text: string): number | undefined {
  return text.trim() === '' ? undefined : (parseDollarsToCents(text) ?? Number.NaN);
}

export function draftToInput(draft: LogWorkDraft) {
  return {
    date: draft.date,
    odometer: draft.odometer.trim() === '' ? null : (parseInteger(draft.odometer) ?? Number.NaN),
    providerName: draft.providerName,
    providerType: draft.providerType ?? undefined,
    notes: draft.notes,
    totalCents: draft.total.trim() === '' ? undefined : (parseDollarsToCents(draft.total) ?? Number.NaN),
    lineItems: draft.lineItems.map((item) => ({
      serviceSlug: item.serviceSlug ?? undefined,
      customName: item.customName ?? undefined,
      costCents: optionalCents(item.cost),
      notes: item.notes,
      packageCode: item.serviceSlug === SCHEDULED_MAINTENANCE_SLUG ? item.packageCode : undefined,
    })),
  };
}

function parseDraft(draft: LogWorkDraft): { ok: true; input: CreateRecord } | { ok: false; errors: DraftErrors } {
  const parsed = createRecordSchema.safeParse(draftToInput(draft));
  if (parsed.success) return { ok: true, input: parsed.data };
  const errors: DraftErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.map(String).join('.');
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

const STEP_FIELDS: Record<1 | 2, (key: string) => boolean> = {
  1: (key) => key === 'lineItems',
  2: (key) => key === 'date' || key === 'odometer' || key.startsWith('provider'),
};

/** Errors that block leaving step 1 or 2; later steps' fields are checked when saving. */
export function stepErrors(draft: LogWorkDraft, step: 1 | 2, today: string = todayIsoDate()): DraftErrors {
  if (draft.lineItems.length === 0) return { lineItems: strings.logWork.noServices };
  if (step === 2 && daysBetween(today, draft.date) > 0) return { date: strings.logWork.futureDate };
  const result = parseDraft(draft);
  if (result.ok) return {};
  return Object.fromEntries(Object.entries(result.errors).filter(([key]) => STEP_FIELDS[step](key)));
}

/** The validated input for the API, or every error to show on the cost step. */
export function buildRecordInput(
  draft: LogWorkDraft,
  today: string = todayIsoDate(),
): { ok: true; input: CreateRecord } | { ok: false; errors: DraftErrors } {
  const earlier = { ...stepErrors(draft, 1, today), ...stepErrors(draft, 2, today) };
  if (Object.keys(earlier).length > 0) return { ok: false, errors: earlier };
  return parseDraft(draft);
}

/**
 * The same consistency rule the API enforces (ADR-0007), run against the local
 * mirror so the Owner sees the conflicting reading before saving.
 */
export function odometerConsistencyError(
  draft: LogWorkDraft,
  vehicle: Vehicle,
  records: readonly ServiceRecord[],
): string | undefined {
  const odometer = draftToInput(draft).odometer;
  if (odometer === null || Number.isNaN(odometer)) return undefined;
  const check = checkOdometerConsistency(
    vehicle,
    records.filter((record) => record.vehicleId === vehicle.id),
    { id: draft.recordId ?? undefined, date: draft.date, odometer },
  );
  return check.ok ? undefined : check.message;
}
