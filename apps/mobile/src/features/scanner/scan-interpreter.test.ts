import type { ScanFrame } from '@/shared/scanner/scan-types';
import { initialOdometerScan, initialVinScan, interpretOdometerFrame, interpretStill, interpretVinFrame } from './scan-interpreter';

const VIN = '1HGCM82633A004352';

function frame(partial: Partial<ScanFrame>): ScanFrame {
  return { barcodes: [], lines: [], frameWidth: 1080, frameHeight: 1920, ...partial };
}

const textLine = (text: string, height = 40) => ({ text, top: 0, left: 0, width: 300, height });

describe('interpretVinFrame', () => {
  it('short-circuits on a door-jamb barcode with a valid VIN', () => {
    const { proposal } = interpretVinFrame(initialVinScan(), frame({ barcodes: [{ format: 'CODE_39', value: `I${VIN}` }] }));

    expect(proposal).toEqual({ kind: 'vin', vin: VIN });
  });

  it('votes windshield text across frames, correcting misreads', () => {
    let state = initialVinScan();
    let proposal = null;
    for (const text of ['1HGCM82633AOO4352', '1HGCMB2633A004352', '1HGCM82633A0O4352']) {
      ({ state, proposal } = interpretVinFrame(state, frame({ lines: [textLine(`VIN ${text}`)] })));
    }

    expect(proposal).toEqual({ kind: 'vin', vin: VIN });
  });
});

describe('interpretOdometerFrame', () => {
  it('locks once the same value is stable, reporting km displays as km', () => {
    let state = initialOdometerScan();
    let proposal = null;
    for (const at of [0, 300, 600]) {
      ({ state, proposal } = interpretOdometerFrame(state, frame({ lines: [textLine('ODO 77589 km')] }), at, {}));
    }

    expect(proposal).toEqual({ kind: 'km', km: 77_589 });
  });
});

describe('interpretStill', () => {
  it('returns the best reading from a single photo', () => {
    expect(interpretStill('odometer', frame({ lines: [textLine('ODO 48,210 mi')] }), {})).toEqual({ kind: 'miles', miles: 48_210 });
    expect(interpretStill('vin', frame({ lines: [textLine(VIN)] }), {})).toEqual({ kind: 'vin', vin: VIN });
    expect(interpretStill('vin', frame({ lines: [textLine('nothing here')] }), {})).toBeNull();
  });
});
