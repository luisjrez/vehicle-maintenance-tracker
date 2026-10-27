import { type ProviderType, todayIsoDate } from '@vmt/shared';
import { create } from 'zustand';

export type DraftLineItem = {
  key: string;
  serviceSlug: string | null;
  customName: string | null;
  cost: string;
  notes: string;
  packageCode: string;
};

export type LineItemField = 'cost' | 'notes' | 'packageCode';

export type LogWorkDraft = {
  vehicleId: string | null;
  /** Set when editing an existing record (ticket 9). */
  recordId: string | null;
  step: 1 | 2 | 3;
  lineItems: DraftLineItem[];
  date: string;
  odometer: string;
  providerName: string;
  providerType: ProviderType | null;
  total: string;
  notes: string;
};

type DraftActions = {
  start: (draft: Partial<LogWorkDraft> & { vehicleId: string }) => void;
  setStep: (step: LogWorkDraft['step']) => void;
  addCatalogService: (serviceSlug: string, notes?: string) => void;
  addCustomService: (name: string) => void;
  removeLineItem: (key: string) => void;
  toggleCatalogService: (serviceSlug: string, notes?: string) => void;
  updateLineItem: (key: string, field: LineItemField, value: string) => void;
  setField: (field: 'date' | 'odometer' | 'providerName' | 'total' | 'notes', value: string) => void;
  setProviderType: (providerType: ProviderType | null) => void;
  reset: () => void;
};

let keySequence = 0;
const nextKey = () => {
  keySequence += 1;
  return `line-${keySequence}`;
};

const blankDraft = (): LogWorkDraft => ({
  vehicleId: null,
  recordId: null,
  step: 1,
  lineItems: [],
  date: todayIsoDate(),
  odometer: '',
  providerName: '',
  providerType: null,
  total: '',
  notes: '',
});

const lineItem = (fields: Partial<DraftLineItem>): DraftLineItem => ({
  key: nextKey(),
  serviceSlug: null,
  customName: null,
  cost: '',
  notes: '',
  packageCode: '',
  ...fields,
});

/**
 * The wizard's in-progress record. It lives outside the screens so the
 * service picker can add to it and a failed save never loses what was typed.
 */
export const useLogWorkDraft = create<LogWorkDraft & DraftActions>()((set) => ({
  ...blankDraft(),
  start: (draft) => set({ ...blankDraft(), ...draft }),
  setStep: (step) => set({ step }),
  addCatalogService: (serviceSlug, notes = '') =>
    set((state) => ({ lineItems: [...state.lineItems, lineItem({ serviceSlug, notes })] })),
  addCustomService: (name) =>
    set((state) => ({ lineItems: [...state.lineItems, lineItem({ customName: name.trim() })] })),
  removeLineItem: (key) => set((state) => ({ lineItems: state.lineItems.filter((item) => item.key !== key) })),
  toggleCatalogService: (serviceSlug, notes = '') =>
    set((state) => {
      const existing = state.lineItems.find((item) => item.serviceSlug === serviceSlug && item.notes === notes);
      return {
        lineItems:
          existing === undefined
            ? [...state.lineItems, lineItem({ serviceSlug, notes })]
            : state.lineItems.filter((item) => item.key !== existing.key),
      };
    }),
  updateLineItem: (key, field, value) =>
    set((state) => ({ lineItems: state.lineItems.map((item) => (item.key === key ? { ...item, [field]: value } : item)) })),
  setField: (field, value) => set({ [field]: value }),
  setProviderType: (providerType) => set({ providerType }),
  reset: () => set(blankDraft()),
}));
