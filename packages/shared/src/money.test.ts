import { centsToDollarInput, parseDollarsToCents } from './money.js';

describe('parseDollarsToCents', () => {
  it.each([
    ['189', 18_900],
    ['189.5', 18_950],
    ['$1,234.56', 123_456],
    [' 0 ', 0],
    ['0.07', 7],
  ])('parses %j as %i cents', (input, cents) => {
    expect(parseDollarsToCents(input)).toBe(cents);
  });

  it.each(['', 'abc', '1.234', '-5', '1,23.4.5'])('rejects %j', (input) => {
    expect(parseDollarsToCents(input)).toBeUndefined();
  });
});

describe('centsToDollarInput', () => {
  it('renders cents for an editable field', () => {
    expect(centsToDollarInput(123_456)).toBe('1234.56');
    expect(centsToDollarInput(18_900)).toBe('189.00');
  });
});
