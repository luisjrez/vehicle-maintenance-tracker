import { computeCheckDigit, modelYearCandidates, normalizeVin, validateVin } from './vin.js';

describe('normalizeVin', () => {
  it('trims, strips spaces and dashes, and uppercases', () => {
    expect(normalizeVin('  1hgcm-826 33a004352 ')).toBe('1HGCM82633A004352');
  });
});

describe('computeCheckDigit', () => {
  it.each([
    ['1HGCM82633A004352', '3'],
    ['1G1ZT53826F109149', '2'],
    ['5YJ3E1EA2KF317000', '2'],
    ['1FTFW1ET9DFC10312', '9'],
  ])('computes the position-9 digit of %s', (vin, digit) => {
    expect(computeCheckDigit(vin)).toBe(digit);
  });

  it('uses X when the remainder is 10', () => {
    expect(computeCheckDigit('1M8GDM9AXKP042788')).toBe('X');
  });
});

describe('validateVin', () => {
  it('accepts a valid VIN and returns it normalized', () => {
    expect(validateVin('1hgcm82633a004352')).toEqual({ ok: true, vin: '1HGCM82633A004352' });
  });

  it.each([
    ['1HGCM82633A00435', 'LENGTH'],
    ['1HGCM82633A0043521', 'LENGTH'],
    ['1HGCM8263IA004352', 'INVALID_CHARACTERS'],
    ['1HGCM8263OA004352', 'INVALID_CHARACTERS'],
    ['1HGCM8263QA004352', 'INVALID_CHARACTERS'],
    ['1HGCM82633A00435*', 'INVALID_CHARACTERS'],
    ['1HGCM8263UA004352', 'INVALID_YEAR_CODE'],
    ['1HGCM8263ZA004352', 'INVALID_YEAR_CODE'],
    ['1HGCM82630A004352', 'INVALID_YEAR_CODE'],
    ['1HGCM82633A004353', 'CHECK_DIGIT'],
  ])('rejects %s with %s', (vin, reason) => {
    expect(validateVin(vin)).toMatchObject({ ok: false, reason });
  });

  it('explains each failure in plain English', () => {
    const result = validateVin('1HGCM82633A004353');
    expect(result.ok ? null : result.message).toMatch(/typo/i);
  });
});

describe('modelYearCandidates', () => {
  it('uses position 7 to pick the 2010–2039 cycle when it is a letter', () => {
    expect(modelYearCandidates('5YJ3E1EA2KF317000', 2026)).toEqual([2019]);
  });

  it('keeps both cycles when position 7 is a digit, dropping future years', () => {
    expect(modelYearCandidates('1HGCM82633A004352', 2026)).toEqual([2003]);
    expect(modelYearCandidates('1G1ZT53826F109149', 2040)).toEqual([2006, 2036]);
  });
});
