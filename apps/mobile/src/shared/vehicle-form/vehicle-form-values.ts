import type { DecodedVehicleDetails, Vehicle } from '@vmt/shared';
import { parseDecimal, parseInteger } from '@/shared/forms/field-errors';

/** What the inputs hold: always strings, parsed only when validating. */
export type VehicleFormValues = {
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyClass: string;
  vehicleType: string;
  fuelType: string;
  electrification: string;
  cylinders: string;
  displacementL: string;
  driveType: string;
  initialOdometer: string;
  nickname: string;
  plate: string;
  plateState: string;
  color: string;
};

export type VehicleFormField = keyof VehicleFormValues;

export const emptyVehicleForm: VehicleFormValues = {
  year: '',
  make: '',
  model: '',
  trim: '',
  bodyClass: '',
  vehicleType: '',
  fuelType: '',
  electrification: '',
  cylinders: '',
  displacementL: '',
  driveType: '',
  initialOdometer: '',
  nickname: '',
  plate: '',
  plateState: '',
  color: '',
};

const text = (value: string | null): string => value ?? '';
const number = (value: number | null): string => (value === null ? '' : String(value));

export function vehicleToFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    year: String(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    trim: text(vehicle.trim),
    bodyClass: text(vehicle.bodyClass),
    vehicleType: text(vehicle.vehicleType),
    fuelType: text(vehicle.fuelType),
    electrification: text(vehicle.electrification),
    cylinders: number(vehicle.cylinders),
    displacementL: number(vehicle.displacementL),
    driveType: text(vehicle.driveType),
    initialOdometer: String(vehicle.initialOdometer),
    nickname: text(vehicle.nickname),
    plate: text(vehicle.plate),
    plateState: text(vehicle.plateState),
    color: text(vehicle.color),
  };
}

const blankToUndefined = (value: string): string | undefined => (value.trim() === '' ? undefined : value);

/** Converts input strings into the shape the shared Zod schema validates. */
export function formValuesToInput(values: VehicleFormValues) {
  return {
    year: parseInteger(values.year),
    make: values.make,
    model: values.model,
    trim: values.trim,
    bodyClass: values.bodyClass,
    vehicleType: values.vehicleType,
    fuelType: values.fuelType,
    electrification: values.electrification,
    cylinders: values.cylinders.trim() === '' ? undefined : parseInteger(values.cylinders) ?? Number.NaN,
    displacementL: values.displacementL.trim() === '' ? undefined : parseDecimal(values.displacementL) ?? Number.NaN,
    driveType: values.driveType,
    initialOdometer: parseInteger(values.initialOdometer),
    nickname: values.nickname,
    plate: values.plate,
    plateState: blankToUndefined(values.plateState.trim().toUpperCase()),
    color: values.color,
  };
}

/** Prefills the form from a VIN decode; a single year candidate stands in when vPIC has no year. */
export function decodedToFormValues(details: DecodedVehicleDetails, yearCandidates: number[]): VehicleFormValues {
  const onlyCandidate = yearCandidates.length === 1 ? yearCandidates[0] : undefined;
  const year = details.year ?? onlyCandidate;
  return {
    ...emptyVehicleForm,
    year: year === undefined ? '' : String(year),
    make: text(details.make),
    model: text(details.model),
    trim: text(details.trim),
    bodyClass: text(details.bodyClass),
    vehicleType: text(details.vehicleType),
    fuelType: text(details.fuelType),
    electrification: text(details.electrification),
    cylinders: number(details.cylinders),
    displacementL: number(details.displacementL),
    driveType: text(details.driveType),
  };
}
