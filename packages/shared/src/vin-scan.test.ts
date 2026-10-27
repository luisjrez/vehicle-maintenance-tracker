import { addVinReading, correctVinReading, emptyVinVote, normalizeBarcodeVin, vinConsensus, vinReadingsFromText } from './vin-scan.js';

const VIN = '1HGCM82633A004352';
const YEAR = 2026;

describe('normalizeBarcodeVin', () => {
  it('strips the leading "I" some door-jamb barcodes carry', () => {
    expect(normalizeBarcodeVin(`I${VIN}`)).toBe(VIN);
  });

  it('accepts a clean 17-character code and rejects anything that is not a valid VIN', () => {
    expect(normalizeBarcodeVin(` ${VIN.toLowerCase()} `)).toBe(VIN);
    expect(normalizeBarcodeVin('1HGCM82633A004353')).toBeNull();
    expect(normalizeBarcodeVin('PART-NO-12345')).toBeNull();
  });
});

describe('vinReadingsFromText', () => {
  it('finds a 17-character run inside noisy OCR text, ignoring spaces, dashes and asterisks', () => {
    expect(vinReadingsFromText('VIN *1HGCM 82633-A004352* MFD BY HONDA')).toContain(VIN);
  });

  it('slides over runs longer than 17 characters', () => {
    expect(vinReadingsFromText(`X${VIN}9`)).toEqual(expect.arrayContaining([VIN]));
  });

  it('returns nothing for text with no 17-character run', () => {
    expect(vinReadingsFromText('GVWR 4,500 LB')).toEqual([]);
  });
});

describe('correctVinReading', () => {
  it('keeps a reading that already passes the check digit', () => {
    expect(correctVinReading(VIN, YEAR)).toEqual([VIN]);
  });

  it('maps I to 1 and O/Q to 0, which never appear in a VIN', () => {
    expect(correctVinReading('IHGCM82633AOO4352', YEAR)).toEqual([VIN]);
    expect(correctVinReading('1HGCM82633A0Q4352', YEAR)).toEqual([VIN]);
  });

  it('forces digits in positions 13–17', () => {
    expect(correctVinReading('1HGCM82633A00435Z', YEAR)).toEqual([VIN]);
    expect(correctVinReading('1HGCM82633A0O43S2', YEAR)).toEqual([VIN]);
  });

  it('tries ambiguous S/5, B/8, Z/2, G/6, D/0 swaps only when the check digit confirms them', () => {
    expect(correctVinReading('1HGCMB2633A004352', YEAR)).toEqual([VIN]);
    expect(correctVinReading('1HGCM8Z633A004352', YEAR)).toEqual([VIN]);
  });

  it('gives up on a reading the check digit cannot rescue', () => {
    expect(correctVinReading('1HGCM82633A004359', YEAR)).toEqual([]);
  });

  it('drops a reading whose model year has not happened yet', () => {
    // Letter in position 7 + "2" in position 10 = model year 2032.
    expect(correctVinReading('5YJ3E1EA22F317000', YEAR)).toEqual([]);
    expect(correctVinReading('5YJ3E1EA22F317000', 2031)).toEqual(['5YJ3E1EA22F317000']);
  });

  it('finds no VIN in a windshield glass stamp', () => {
    const readings = vinReadingsFromText('LAMINATED DOT825 AS1 M850');

    expect(readings.flatMap((reading) => correctVinReading(reading, YEAR))).toEqual([]);
  });
});

describe('VIN voting across frames', () => {
  it('locks only after enough agreeing frames', () => {
    let vote = emptyVinVote();
    vote = addVinReading(vote, VIN);
    vote = addVinReading(vote, VIN);
    expect(vinConsensus(vote)).toBeNull();

    vote = addVinReading(vote, VIN);
    expect(vinConsensus(vote)).toEqual({ vin: VIN, frames: 3 });
  });

  it('outvotes a single misread character per position', () => {
    let vote = emptyVinVote();
    for (const reading of [VIN, '1HGCM82633A004353', VIN, VIN, '1HGCM82B33A004352']) vote = addVinReading(vote, reading);

    expect(vinConsensus(vote)?.vin).toBe(VIN);
  });

  it('does not lock while frames disagree too much', () => {
    let vote = emptyVinVote();
    for (const reading of [VIN, '5YJ3E1EA2KF317000', VIN, '5YJ3E1EA2KF317000']) vote = addVinReading(vote, reading);

    expect(vinConsensus(vote)).toBeNull();
  });

  it('keeps only the latest readings so an old misread cannot block a lock forever', () => {
    let vote = emptyVinVote();
    for (let i = 0; i < 5; i += 1) vote = addVinReading(vote, '5YJ3E1EA2KF317000');
    for (let i = 0; i < 12; i += 1) vote = addVinReading(vote, VIN);

    expect(vinConsensus(vote)?.vin).toBe(VIN);
  });
});
