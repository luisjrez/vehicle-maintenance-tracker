import { currentMileage } from './odometer.js';

describe('currentMileage', () => {
  it('is the initial odometer when there are no record readings', () => {
    expect(currentMileage({ initialOdometer: 47_750 }, [])).toBe(47_750);
  });

  it('is the highest of all readings, skipping records without an odometer', () => {
    expect(currentMileage({ initialOdometer: 40_000 }, [{ odometer: 52_000 }, { odometer: null }, { odometer: 45_000 }])).toBe(
      52_000,
    );
  });

  it('ignores backfilled readings lower than the initial odometer', () => {
    expect(currentMileage({ initialOdometer: 40_000 }, [{ odometer: 12_000 }])).toBe(40_000);
  });
});
