import { useCallback, useMemo, useState } from 'react';
import type { VehicleFormField, VehicleFormValues } from './vehicle-form-values';

export type FieldSetters = Record<VehicleFormField, (value: string) => void>;
export type FieldErrors = Partial<Record<string, string>>;

function makeSetters(update: (field: VehicleFormField, value: string) => void): FieldSetters {
  return {
    year: (value) => update('year', value),
    make: (value) => update('make', value),
    model: (value) => update('model', value),
    trim: (value) => update('trim', value),
    bodyClass: (value) => update('bodyClass', value),
    vehicleType: (value) => update('vehicleType', value),
    fuelType: (value) => update('fuelType', value),
    electrification: (value) => update('electrification', value),
    cylinders: (value) => update('cylinders', value),
    displacementL: (value) => update('displacementL', value),
    driveType: (value) => update('driveType', value),
    initialOdometer: (value) => update('initialOdometer', value),
    nickname: (value) => update('nickname', value),
    plate: (value) => update('plate', value),
    plateState: (value) => update('plateState', value),
    color: (value) => update('color', value),
  };
}

/** Form state for adding or editing a vehicle; one stable setter per field so inputs never get inline handlers. */
export function useVehicleForm(initial: VehicleFormValues) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setters = useMemo(
    () => makeSetters((field, value) => setValues((current) => ({ ...current, [field]: value }))),
    [],
  );
  const replaceValues = useCallback((next: VehicleFormValues) => setValues(next), []);

  return { values, setters, errors, setErrors, replaceValues };
}
