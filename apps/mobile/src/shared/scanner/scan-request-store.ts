import { create } from 'zustand';
import type { ScanMode } from './scan-types';

type ScanRequest = { id: number; mode: ScanMode };
type ScanResult = { requestId: number; mode: ScanMode; value: string };

type ScanRequestState = {
  request: ScanRequest | null;
  result: ScanResult | null;
  open: (mode: ScanMode) => number;
  deliver: (value: string) => void;
  clear: () => void;
};

let nextId = 0;

/**
 * Hands a scanned value from the full-screen scanner back to the field that
 * opened it. The value only fills an editable field; nothing is saved (ADR-0006).
 */
export const useScanRequestStore = create<ScanRequestState>()((set, get) => ({
  request: null,
  result: null,
  open: (mode) => {
    nextId += 1;
    set({ request: { id: nextId, mode }, result: null });
    return nextId;
  },
  deliver: (value) => {
    const { request } = get();
    if (request !== null) set({ result: { requestId: request.id, mode: request.mode, value }, request: null });
  },
  clear: () => set({ request: null, result: null }),
}));
