import { createRecordSchema } from './service-record.js';

const valid = {
  date: '2026-03-04',
  totalCents: 18_900,
  lineItems: [{ serviceSlug: 'oil-change' }],
};

describe('createRecordSchema', () => {
  it('accepts a minimal record', () => {
    expect(createRecordSchema.safeParse(valid).success).toBe(true);
  });

  it('allows a $0 total (warranty work) but not a negative or fractional one', () => {
    expect(createRecordSchema.safeParse({ ...valid, totalCents: 0 }).success).toBe(true);
    expect(createRecordSchema.safeParse({ ...valid, totalCents: -1 }).success).toBe(false);
    expect(createRecordSchema.safeParse({ ...valid, totalCents: 10.5 }).success).toBe(false);
  });

  it('requires at least one line item', () => {
    expect(createRecordSchema.safeParse({ ...valid, lineItems: [] }).success).toBe(false);
  });

  it('requires exactly one of catalog service or custom name per line item', () => {
    const neither = { ...valid, lineItems: [{ notes: 'something' }] };
    const both = { ...valid, lineItems: [{ serviceSlug: 'oil-change', customName: 'Oil' }] };
    const custom = { ...valid, lineItems: [{ customName: '  Rust check ' }] };

    expect(createRecordSchema.safeParse(neither).success).toBe(false);
    expect(createRecordSchema.safeParse(both).success).toBe(false);
    expect(createRecordSchema.parse(custom).lineItems[0]?.customName).toBe('Rust check');
  });

  it('rejects a service slug that is not in the catalog', () => {
    expect(createRecordSchema.safeParse({ ...valid, lineItems: [{ serviceSlug: 'flux-capacitor' }] }).success).toBe(false);
  });

  it('only allows a package code on scheduled maintenance', () => {
    const scheduled = { ...valid, lineItems: [{ serviceSlug: 'scheduled-maintenance', packageCode: 'Honda B12' }] };
    const oil = { ...valid, lineItems: [{ serviceSlug: 'oil-change', packageCode: 'B12' }] };

    expect(createRecordSchema.safeParse(scheduled).success).toBe(true);
    expect(createRecordSchema.safeParse(oil).success).toBe(false);
  });

  it('rejects negative line costs and a date in the future', () => {
    expect(createRecordSchema.safeParse({ ...valid, lineItems: [{ serviceSlug: 'oil-change', costCents: -100 }] }).success).toBe(
      false,
    );
    expect(createRecordSchema.safeParse({ ...valid, date: '2999-01-01' }).success).toBe(false);
  });

  it('accepts provider type from the fixed list only', () => {
    expect(createRecordSchema.safeParse({ ...valid, providerName: 'Jiffy Lube', providerType: 'chain' }).success).toBe(true);
    expect(createRecordSchema.safeParse({ ...valid, providerType: 'friend' }).success).toBe(false);
  });

  it('accepts an optional odometer within bounds', () => {
    expect(createRecordSchema.safeParse({ ...valid, odometer: 52_000 }).success).toBe(true);
    expect(createRecordSchema.safeParse({ ...valid, odometer: null }).success).toBe(true);
    expect(createRecordSchema.safeParse({ ...valid, odometer: 10_000_000 }).success).toBe(false);
  });
});
