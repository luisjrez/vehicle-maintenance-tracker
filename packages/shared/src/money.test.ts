import { centsToDollarInput, formatDollarInput, parseDollarsToCents } from './money.js';

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
  it('renders cents for an editable field, grouped like the formatter', () => {
    expect(centsToDollarInput(123_456)).toBe('1,234.56');
    expect(centsToDollarInput(18_900)).toBe('189.00');
    expect(centsToDollarInput(7)).toBe('0.07');
  });
});

describe('formatDollarInput', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['1234', '1,234'],
    ['1234567.8', '1,234,567.8'],
    ['1234.5', '1,234.5'],
    ['89.', '89.'],
    ['.5', '0.5'],
    ['0012', '12'],
    ['0', '0'],
    ['0.07', '0.07'],
  ])('formats %j as %j while typing', (typed, shown) => {
    expect(formatDollarInput(typed)).toBe(shown);
  });

  it('re-groups a value that already has separators', () => {
    expect(formatDollarInput('1,2345')).toBe('12,345');
  });

  it('keeps at most two decimals and one decimal point', () => {
    expect(formatDollarInput('12.345')).toBe('12.34');
    expect(formatDollarInput('1.2.3')).toBe('1.23');
  });

  it('drops anything that is not a digit or the decimal point', () => {
    expect(formatDollarInput('$4a5-6')).toBe('456');
  });

  it('round-trips with the parser', () => {
    expect(parseDollarsToCents(formatDollarInput('1234567.89'))).toBe(123_456_789);
  });
});
