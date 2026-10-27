import { createVehicleSchema, ODOMETER_MAX, updateVehicleSchema, vehicleDisplayName } from './vehicle.js';

const valid = {
  year: 2019,
  make: 'Honda',
  model: 'Civic',
  initialOdometer: 47_750,
  initialOdometerDate: '2026-10-26',
};

describe('createVehicleSchema', () => {
  it('accepts a minimal manual vehicle and trims text', () => {
    const parsed = createVehicleSchema.parse({ ...valid, make: '  Honda ', nickname: ' Daily ' });

    expect(parsed.make).toBe('Honda');
    expect(parsed.nickname).toBe('Daily');
  });

  it('turns blank optional text into undefined', () => {
    expect(createVehicleSchema.parse({ ...valid, trim: '   ' }).trim).toBeUndefined();
  });

  it('requires the initial odometer within 0–9,999,999 whole miles', () => {
    expect(createVehicleSchema.safeParse({ ...valid, initialOdometer: 0 }).success).toBe(true);
    expect(createVehicleSchema.safeParse({ ...valid, initialOdometer: ODOMETER_MAX }).success).toBe(true);
    expect(createVehicleSchema.safeParse({ ...valid, initialOdometer: ODOMETER_MAX + 1 }).success).toBe(false);
    expect(createVehicleSchema.safeParse({ ...valid, initialOdometer: -1 }).success).toBe(false);
    expect(createVehicleSchema.safeParse({ ...valid, initialOdometer: 12.5 }).success).toBe(false);
    const { initialOdometer: _omit, ...withoutOdometer } = valid;
    expect(createVehicleSchema.safeParse(withoutOdometer).success).toBe(false);
  });

  it('rejects a model year outside the plausible range', () => {
    expect(createVehicleSchema.safeParse({ ...valid, year: 1885 }).success).toBe(false);
    expect(createVehicleSchema.safeParse({ ...valid, year: 2200 }).success).toBe(false);
  });

  it('requires make and model', () => {
    expect(createVehicleSchema.safeParse({ ...valid, make: ' ' }).success).toBe(false);
    expect(createVehicleSchema.safeParse({ ...valid, model: '' }).success).toBe(false);
  });

  it('accepts only US state codes for the plate state', () => {
    expect(createVehicleSchema.safeParse({ ...valid, plateState: 'CA' }).success).toBe(true);
    expect(createVehicleSchema.safeParse({ ...valid, plateState: 'ZZ' }).success).toBe(false);
  });

  it('requires a calendar date for the initial odometer reading', () => {
    expect(createVehicleSchema.safeParse({ ...valid, initialOdometerDate: '2026-13-01' }).success).toBe(false);
  });
});

describe('vehicleDisplayName', () => {
  it('prefers the nickname', () => {
    expect(vehicleDisplayName({ nickname: 'Daily', year: 2019, make: 'Honda', model: 'Civic' })).toBe('Daily');
  });

  it('falls back to "<year> <make> <model>"', () => {
    expect(vehicleDisplayName({ nickname: null, year: 2019, make: 'Honda', model: 'Civic' })).toBe(
      '2019 Honda Civic',
    );
  });
});

describe('createVehicleSchema VIN', () => {
  it('normalizes a valid VIN', () => {
    expect(createVehicleSchema.parse({ ...valid, vin: '1hgcm 82633a004352' }).vin).toBe('1HGCM82633A004352');
  });

  it('rejects an invalid VIN with a readable message', () => {
    const result = createVehicleSchema.safeParse({ ...valid, vin: '1HGCM82633A004353' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/typos/);
  });
});

describe('updateVehicleSchema', () => {
  it('accepts partial edits and null to clear optional fields', () => {
    expect(updateVehicleSchema.parse({ nickname: null, trim: 'LX', vin: null })).toEqual({ nickname: null, trim: 'LX', vin: null });
  });

  it('runs the same validation as creation', () => {
    expect(updateVehicleSchema.safeParse({ vin: '1HGCM82633A004353' }).success).toBe(false);
    expect(updateVehicleSchema.safeParse({ initialOdometer: -1 }).success).toBe(false);
    expect(updateVehicleSchema.safeParse({ make: '' }).success).toBe(false);
  });

  it('rejects unknown fields such as the creation date', () => {
    expect(updateVehicleSchema.safeParse({ initialOdometerDate: '2020-01-01' }).success).toBe(false);
  });
});
