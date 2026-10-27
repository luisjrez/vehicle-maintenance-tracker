import { useEffect } from 'react';
import { View } from 'react-native';
import type { ScannerPermission } from '@/features/scanner/scanner-camera';
import type { ScanFrame, ScanMode } from '@/shared/scanner/scan-types';

// JS stand-in for the VisionCamera + ML Kit bridge so screens run under Jest.
let currentOnFrame: ((frame: ScanFrame) => void) | null = null;
let permission: Pick<ScannerPermission, 'granted' | 'canAsk'> = { granted: true, canAsk: false };
export const askPermission = jest.fn(() => Promise.resolve(true));
export const openSettings = jest.fn(() => Promise.resolve());

export function ScannerCamera({ mode, onFrame }: { mode: ScanMode; onFrame: (frame: ScanFrame) => void }) {
  useEffect(() => {
    currentOnFrame = onFrame;
  }, [onFrame]);
  return <View testID={`scanner-camera-${mode}`} />;
}

export function useScannerPermission(): ScannerPermission {
  return { ...permission, ask: askPermission, openSettings };
}

export function useBackCameraAvailable(): boolean {
  return true;
}

/** Feeds a frame to the mounted camera, as the native frame processor would. */
export function emitScanFrame(frame: Partial<ScanFrame>): void {
  currentOnFrame?.({ barcodes: [], lines: [], frameWidth: 1080, frameHeight: 1920, ...frame });
}

export function setCameraPermission(next: Pick<ScannerPermission, 'granted' | 'canAsk'>): void {
  permission = next;
}

export function resetScannerMock(): void {
  currentOnFrame = null;
  permission = { granted: true, canAsk: false };
  askPermission.mockClear();
  openSettings.mockClear();
}
