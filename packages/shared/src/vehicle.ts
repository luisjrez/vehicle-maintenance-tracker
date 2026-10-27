import { z } from 'zod';
import { isoDateSchema } from './dates.js';
import { US_STATE_CODES } from './us-states.js';
import { normalizeVin, validateVin } from './vin.js';

/** Odometer readings are whole miles in 0–9,999,999 (ADR-0002, odometer scanning decisions). */
export const ODOMETER_MAX = 9_999_999;
/** Abuse guard for an unauthenticated API (ADR-0003). */
export const MAX_VEHICLES_PER_OWNER = 20;
/** The first gasoline car is from 1886; next year's models are sold this year. */
export const MIN_MODEL_YEAR = 1886;
export const maxModelYear = (now: Date = new Date()): number => now.getFullYear() + 1;

export const odometerSchema = z
  .number({ error: 'Enter the odometer in whole miles.' })
  .int('Enter the odometer in whole miles.')
  .min(0, 'The odometer cannot be negative.')
  .max(ODOMETER_MAX, 'The odometer can be at most 9,999,999 miles.');

/** Optional free text: trimmed, and blank becomes "not set". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters.`)
    .transform((value) => (value === '' ? undefined : value))
    .optional();

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `Use at most ${max} characters.`);

/** Everything about a vehicle that the Owner can edit, decoded from the VIN or typed in. */
export const vehicleDetailsShape = {
  year: z
    .number({ error: 'Year is required.' })
    .int()
    .min(MIN_MODEL_YEAR, `Enter a year from ${MIN_MODEL_YEAR}.`)
    .refine((year) => year <= maxModelYear(), 'Enter a valid model year.'),
  make: requiredText('Make', 60),
  model: requiredText('Model', 60),
  trim: optionalText(60),
  bodyClass: optionalText(60),
  vehicleType: optionalText(60),
  fuelType: optionalText(60),
  electrification: optionalText(60),
  cylinders: z.number().int().min(1).max(16).optional(),
  displacementL: z.number().positive().max(20).optional(),
  driveType: optionalText(60),
  nickname: optionalText(40),
  plate: optionalText(10),
  plateState: z.enum(US_STATE_CODES, { error: 'Choose a US state.' }).optional(),
  color: optionalText(30),
};

/** A VIN, normalized and strictly validated; the same rule runs in the app and the API. */
export const vinSchema = z
  .string()
  .transform(normalizeVin)
  .superRefine((vin, context) => {
    const result = validateVin(vin);
    if (!result.ok) context.addIssue({ code: 'custom', message: result.message });
  });

export const createVehicleSchema = z.object({
  vin: vinSchema.optional(),
  ...vehicleDetailsShape,
  initialOdometer: odometerSchema,
  /** The phone's local date when the vehicle is added; the initial reading is dated on it. */
  initialOdometerDate: isoDateSchema,
});

export type CreateVehicleInput = z.input<typeof createVehicleSchema>;
export type CreateVehicle = z.output<typeof createVehicleSchema>;

export const vehicleSchema = z.object({
  id: z.string(),
  vin: z.string().nullable(),
  year: z.number().int(),
  make: z.string(),
  model: z.string(),
  trim: z.string().nullable(),
  bodyClass: z.string().nullable(),
  vehicleType: z.string().nullable(),
  fuelType: z.string().nullable(),
  electrification: z.string().nullable(),
  cylinders: z.number().int().nullable(),
  displacementL: z.number().nullable(),
  driveType: z.string().nullable(),
  nickname: z.string().nullable(),
  plate: z.string().nullable(),
  plateState: z.string().nullable(),
  color: z.string().nullable(),
  initialOdometer: z.number().int(),
  initialOdometerDate: isoDateSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

/** Optional fields accept `null` to clear them; omitted fields stay as they are. */
const clearable = <T extends z.ZodType>(schema: T) => schema.nullable().optional();

/** PATCH body: every field is editable, decoded details and VIN included (ADR-0003). */
export const updateVehicleSchema = z
  .object({
    vin: clearable(vinSchema),
    year: vehicleDetailsShape.year.optional(),
    make: vehicleDetailsShape.make.optional(),
    model: vehicleDetailsShape.model.optional(),
    trim: clearable(vehicleDetailsShape.trim),
    bodyClass: clearable(vehicleDetailsShape.bodyClass),
    vehicleType: clearable(vehicleDetailsShape.vehicleType),
    fuelType: clearable(vehicleDetailsShape.fuelType),
    electrification: clearable(vehicleDetailsShape.electrification),
    cylinders: clearable(vehicleDetailsShape.cylinders),
    displacementL: clearable(vehicleDetailsShape.displacementL),
    driveType: clearable(vehicleDetailsShape.driveType),
    nickname: clearable(vehicleDetailsShape.nickname),
    plate: clearable(vehicleDetailsShape.plate),
    plateState: clearable(vehicleDetailsShape.plateState),
    color: clearable(vehicleDetailsShape.color),
    initialOdometer: odometerSchema.optional(),
  })
  .strict();

export type UpdateVehicleInput = z.input<typeof updateVehicleSchema>;
export type UpdateVehicle = z.output<typeof updateVehicleSchema>;

export const vehicleListSchema = z.array(vehicleSchema);

export function vehicleDisplayName(vehicle: Pick<Vehicle, 'nickname' | 'year' | 'make' | 'model'>): string {
  return vehicle.nickname ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}
