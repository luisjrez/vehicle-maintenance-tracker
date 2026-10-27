import { vinFeedback } from './vin-feedback';

describe('vinFeedback', () => {
  it('counts characters while the VIN is incomplete', () => {
    expect(vinFeedback('1HGCM 826')).toEqual({ state: 'typing', message: '8/17 characters' });
  });

  it('flags I, O and Q immediately', () => {
    expect(vinFeedback('1HGO').state).toBe('invalid');
  });

  it('reports a wrong check digit once all 17 characters are in', () => {
    expect(vinFeedback('1HGCM82633A004353')).toMatchObject({ state: 'invalid', message: expect.stringMatching(/typos/) });
  });

  it('accepts a valid VIN, normalized', () => {
    expect(vinFeedback('1hgcm-82633a004352')).toEqual({ state: 'valid', vin: '1HGCM82633A004352' });
  });
});
