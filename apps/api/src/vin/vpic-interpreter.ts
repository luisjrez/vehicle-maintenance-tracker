import { type DecodedVehicleDetails, emptyDecodedDetails } from '@vmt/shared';
import { z } from 'zod';

const vpicPayloadSchema = z.object({
  Results: z.array(z.record(z.string(), z.unknown())).min(1),
});

export type VpicInterpretation = { status: 'decoded' | 'no_data'; details: DecodedVehicleDetails };

// vPIC answers HTTP 200 for everything; success or failure is in ErrorCode.
// 0 = clean; 9, 10, 12, 14 are warnings that still decode. Anything else
// (check digit, incomplete, not a US-market maker, no data) means "no data".
const DECODED_CODES = new Set(['0', '9', '10', '12', '14']);

// Brands vPIC spells in capitals that should stay that way.
const UPPERCASE_WORDS = new Set(['BMW', 'GMC', 'RAM', 'MINI', 'MG', 'AMC', 'SRT', 'VPG', 'BYD']);

function text(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' || trimmed === 'Not Applicable' ? null : trimmed;
}

function integer(row: Record<string, unknown>, key: string): number | null {
  const value = text(row, key);
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
}

/** "MERCEDES-BENZ" → "Mercedes-Benz", "PASSENGER CAR" → "Passenger Car", "BMW" stays. */
function titleCase(value: string | null): string | null {
  if (value === null) return null;
  return value
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (word) =>
      UPPERCASE_WORDS.has(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1),
    );
}

function displacement(row: Record<string, unknown>): number | null {
  const value = text(row, 'DisplacementL');
  if (value === null || !/^\d+(\.\d+)?$/.test(value)) return null;
  return Math.round(Number(value) * 10) / 10;
}

/** Maps vPIC's 154 string fields onto the details we keep (ADR-0003). */
export function interpretVpicResponse(payload: unknown): VpicInterpretation {
  const parsed = vpicPayloadSchema.safeParse(payload);
  const row = parsed.success ? parsed.data.Results[0] : undefined;
  if (row === undefined) return { status: 'no_data', details: emptyDecodedDetails };

  const details: DecodedVehicleDetails = {
    year: integer(row, 'ModelYear'),
    make: titleCase(text(row, 'Make')),
    model: text(row, 'Model'),
    trim: text(row, 'Trim') ?? text(row, 'Series'),
    bodyClass: text(row, 'BodyClass'),
    vehicleType: titleCase(text(row, 'VehicleType')),
    fuelType: text(row, 'FuelTypePrimary'),
    electrification: text(row, 'ElectrificationLevel'),
    cylinders: integer(row, 'EngineCylinders'),
    displacementL: displacement(row),
    driveType: text(row, 'DriveType'),
  };
  const codes = (text(row, 'ErrorCode') ?? '').split(',').map((code) => code.trim());
  const clean = codes.length > 0 && codes.every((code) => DECODED_CODES.has(code));
  const complete = details.make !== null && details.model !== null && details.year !== null;
  return { status: clean && complete ? 'decoded' : 'no_data', details };
}
