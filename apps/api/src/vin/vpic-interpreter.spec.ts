import { readFileSync } from 'node:fs';
import { interpretVpicResponse } from './vpic-interpreter.js';

function recorded(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../test/fixtures/vpic/${name}.json`, import.meta.url), 'utf8'));
}

describe('interpretVpicResponse (contract: recorded real vPIC responses)', () => {
  it('maps a clean decode to our details with display casing', () => {
    expect(interpretVpicResponse(recorded('1HGCM82633A004352'))).toEqual({
      status: 'decoded',
      details: {
        year: 2003,
        make: 'Honda',
        model: 'Accord',
        trim: 'EX-V6',
        bodyClass: 'Coupe',
        vehicleType: 'Passenger Car',
        fuelType: 'Gasoline',
        electrification: null,
        cylinders: 6,
        displacementL: 3,
        driveType: null,
      },
    });
  });

  it('keeps electrification and leaves empty engine fields unknown for an EV', () => {
    const result = interpretVpicResponse(recorded('5YJ3E1EA2KF317000'));

    expect(result.status).toBe('decoded');
    expect(result.details).toMatchObject({
      make: 'Tesla',
      model: 'Model 3',
      year: 2019,
      fuelType: 'Electric',
      electrification: 'BEV (Battery Electric Vehicle)',
      cylinders: null,
      displacementL: null,
    });
  });

  it('decodes a hybrid and a truck with drive type', () => {
    expect(interpretVpicResponse(recorded('JTDKN3DU6A0123456')).details).toMatchObject({
      make: 'Toyota',
      model: 'Prius',
      displacementL: 1.8,
    });
    expect(interpretVpicResponse(recorded('1FTFW1ET9DFC10312')).details).toMatchObject({
      make: 'Ford',
      model: 'F-150',
      driveType: '4WD/4-Wheel Drive/4x4',
    });
  });

  it.each(['ABC123', 'ZZZZZZZZZZZZZZZZZ', '1HGCM8263QA004352'])('treats error codes in %s as no data', (name) => {
    expect(interpretVpicResponse(recorded(name)).status).toBe('no_data');
  });

  it('treats "manufacturer not registered" / "no detailed data" as no data, keeping what was decoded', () => {
    const payload = {
      Results: [{ ErrorCode: '8', Make: 'HONDA', Model: '', ModelYear: '2003', Trim: '' }],
    };

    expect(interpretVpicResponse(payload)).toMatchObject({ status: 'no_data', details: { make: 'Honda', year: 2003 } });
  });

  it('treats an unexpected shape as no data rather than crashing', () => {
    expect(interpretVpicResponse({ nope: true }).status).toBe('no_data');
  });
});
