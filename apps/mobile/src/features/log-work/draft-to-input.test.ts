import { buildRecordInput, stepErrors } from './draft-to-input';
import type { LogWorkDraft } from './log-work-draft';

function draft(overrides: Partial<LogWorkDraft> = {}): LogWorkDraft {
  return {
    vehicleId: 'vehicle-1',
    recordId: null,
    step: 1,
    lineItems: [{ key: 'a', serviceSlug: 'oil-change', customName: null, cost: '', notes: '', packageCode: '' }],
    date: '2026-03-04',
    odometer: '',
    providerName: '',
    providerType: null,
    total: '89.99',
    notes: '',
    ...overrides,
  };
}

describe('stepErrors', () => {
  it('blocks step 1 without services', () => {
    expect(stepErrors(draft({ lineItems: [] }), 1)).toEqual({ lineItems: 'Pick at least one service.' });
  });

  it('blocks step 2 on a future date in the Owner’s own time zone', () => {
    expect(stepErrors(draft({ date: '2026-03-05' }), 2, '2026-03-04')).toEqual({ date: 'The date cannot be in the future.' });
  });

  it('blocks step 2 on a malformed odometer but ignores step-3 fields', () => {
    expect(stepErrors(draft({ odometer: '12.5', total: '' }), 2, '2026-03-04')).toHaveProperty('odometer');
    expect(stepErrors(draft({ total: '' }), 2, '2026-03-04')).toEqual({});
  });
});

describe('buildRecordInput', () => {
  it('turns the draft into cents, miles and line items', () => {
    const result = buildRecordInput(
      draft({
        odometer: '52,000',
        providerName: 'Jiffy Lube',
        providerType: 'chain',
        total: '$1,234.50',
        lineItems: [
          { key: 'a', serviceSlug: 'scheduled-maintenance', customName: null, cost: '200', notes: '', packageCode: '30k service' },
          { key: 'b', serviceSlug: null, customName: 'Rust check', cost: '', notes: 'Underbody', packageCode: '' },
        ],
      }),
      '2026-03-04',
    );

    expect(result).toEqual({
      ok: true,
      input: {
        date: '2026-03-04',
        odometer: 52_000,
        providerName: 'Jiffy Lube',
        providerType: 'chain',
        totalCents: 123_450,
        lineItems: [
          { serviceSlug: 'scheduled-maintenance', costCents: 20_000, packageCode: '30k service' },
          { customName: 'Rust check', notes: 'Underbody' },
        ],
      },
    });
  });

  it('requires the total paid', () => {
    const result = buildRecordInput(draft({ total: '' }), '2026-03-04');
    expect(result.ok ? null : result.errors.totalCents).toBeDefined();
  });

  it('flags a bad line cost on its own line', () => {
    const result = buildRecordInput(
      draft({ lineItems: [{ key: 'a', serviceSlug: 'oil-change', customName: null, cost: 'abc', notes: '', packageCode: '' }] }),
      '2026-03-04',
    );
    expect(result.ok ? null : result.errors['lineItems.0.costCents']).toBeDefined();
  });
});
