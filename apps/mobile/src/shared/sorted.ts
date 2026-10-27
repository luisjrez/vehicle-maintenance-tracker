/**
 * Non-mutating sort. Hermes does not ship `Array.prototype.toSorted` yet (Jest's
 * Node does, so tests alone would not catch it).
 */
export function sorted<T>(items: readonly T[], compare: (a: T, b: T) => number): T[] {
  const copy = [...items];
  copy.sort(compare);
  return copy;
}
