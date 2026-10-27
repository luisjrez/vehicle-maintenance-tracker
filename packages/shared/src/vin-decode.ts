import { z } from 'zod';

/**
 * Result of `GET /v1/vin/:vin`. Decoding never blocks adding a vehicle:
 * `no_data` (vPIC knows nothing useful) and `unavailable` (vPIC is down) both
 * lead to the manual form, prefilled with whatever is known.
 */
export const vinDecodeStatusSchema = z.enum(['decoded', 'no_data', 'unavailable']);
export type VinDecodeStatus = z.infer<typeof vinDecodeStatusSchema>;

export const decodedVehicleDetailsSchema = z.object({
  year: z.number().int().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  trim: z.string().nullable(),
  bodyClass: z.string().nullable(),
  vehicleType: z.string().nullable(),
  fuelType: z.string().nullable(),
  electrification: z.string().nullable(),
  cylinders: z.number().int().nullable(),
  displacementL: z.number().nullable(),
  driveType: z.string().nullable(),
});
export type DecodedVehicleDetails = z.infer<typeof decodedVehicleDetailsSchema>;

export const vinDecodeResponseSchema = z.object({
  vin: z.string(),
  status: vinDecodeStatusSchema,
  details: decodedVehicleDetailsSchema,
  /** From position 10 (+7); a fallback when vPIC has no model year. */
  modelYearCandidates: z.array(z.number().int()),
});
export type VinDecodeResponse = z.infer<typeof vinDecodeResponseSchema>;

export const emptyDecodedDetails: DecodedVehicleDetails = {
  year: null,
  make: null,
  model: null,
  trim: null,
  bodyClass: null,
  vehicleType: null,
  fuelType: null,
  electrification: null,
  cylinders: null,
  displacementL: null,
  driveType: null,
};
