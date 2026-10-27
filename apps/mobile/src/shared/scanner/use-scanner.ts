import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useScanRequestStore } from './scan-request-store';
import type { ScanMode } from './scan-types';

/** Opens the scanner in `mode` and calls `onResult` with the value the Owner confirmed there. */
export function useScanner(mode: ScanMode, onResult: (value: string) => void): () => void {
  const router = useRouter();
  const requestId = useRef<number | null>(null);
  const result = useScanRequestStore((state) => state.result);
  const open = useScanRequestStore((state) => state.open);
  const clear = useScanRequestStore((state) => state.clear);

  useEffect(() => {
    if (result === null || result.requestId !== requestId.current) return;
    requestId.current = null;
    clear();
    onResult(result.value);
  }, [result, onResult, clear]);

  return useCallback(() => {
    requestId.current = open(mode);
    router.push({ pathname: '/scanner', params: { mode } });
  }, [open, mode, router]);
}
