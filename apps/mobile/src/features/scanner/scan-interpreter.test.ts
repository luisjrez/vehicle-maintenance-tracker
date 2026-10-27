import type { ScanFrame } from '@/shared/scanner/scan-types';
import { initialOdometerScan, initialVinScan, interpretOdometerFrame, interpretStill, interpretVinFrame } from './scan-interpreter';

const VIN = '1HGCM82633A004352';

function frame(partial: Partial<ScanFrame>): ScanFrame {
  return { barcodes: [], lines: [], frameWidth: 1080, frameHeight: 1920, ...partial };
}

const YEAR = 2026;

const textLine = (text: string, height = 40) => ({ text, top: 0, left: 0, width: 300, height });

describe('interpretVinFrame', () => {
  it('short-circuits on a door-jamb barcode with a valid VIN', () => {
    const { proposal } = interpretVinFrame(initialVinScan(), frame({ barcodes: [{ format: 'CODE_39', value: `I${VIN}` }] }), YEAR);

    expect(proposal).toEqual({ kind: 'vin', vin: VIN });
  });

  it('votes windshield text across frames, correcting misreads', () => {
    let state = initialVinScan();
    let proposal = null;
    for (const text of ['1HGCM82633AOO4352', '1HGCMB2633A004352', '1HGCM82633A0O4352']) {
      ({ state, proposal } = interpretVinFrame(state, frame({ lines: [textLine(`VIN ${text}`)] }), YEAR));
    }

    expect(proposal).toEqual({ kind: 'vin', vin: VIN });
  });
});

describe('VIN text across OCR lines', () => {
  it('joins pieces of one row, in reading order', () => {
    const lines = [
      { text: '33A004352', top: 102, left: 320, width: 280, height: 40 },
      { text: '1HGCM826', top: 100, left: 20, width: 260, height: 40 },
    ];

    expect(interpretStill('vin', frame({ lines }), {}, YEAR)).toEqual({ kind: 'vin', vin: VIN });
  });

  it('never splices lines from different rows into one VIN', () => {
    const lines = [
      { text: '1HGCM826', top: 100, left: 20, width: 260, height: 40 },
      { text: '33A004352', top: 300, left: 20, width: 280, height: 40 },
    ];

    expect(interpretStill('vin', frame({ lines }), {}, YEAR)).toBeNull();
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
    expect(interpretStill('odometer', frame({ lines: [textLine('ODO 48,210 mi')] }), {}, YEAR)).toEqual({ kind: 'miles', miles: 48_210 });
    expect(interpretStill('vin', frame({ lines: [textLine(VIN)] }), {}, YEAR)).toEqual({ kind: 'vin', vin: VIN });
    expect(interpretStill('vin', frame({ lines: [textLine('nothing here')] }), {}, YEAR)).toBeNull();
  });
});
