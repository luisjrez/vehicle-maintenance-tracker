import { type RefObject, useEffect, useImperativeHandle } from 'react';
import { View } from 'react-native';
import type { ScannerCapture, ScannerPermission } from '@/features/scanner/scanner-camera';
import type { ScanFrame, ScanMode } from '@/shared/scanner/scan-types';

// JS stand-in for the VisionCamera + ML Kit bridge so screens run under Jest.
let currentOnFrame: ((frame: ScanFrame) => void) | null = null;
let permission: Pick<ScannerPermission, 'granted' | 'canAsk'> = { granted: true, canAsk: false };
export const askPermission = jest.fn(() => Promise.resolve(true));
export const openSettings = jest.fn(() => Promise.resolve());

let stillFrame: ScanFrame | null = null;

type MockProps = { mode: ScanMode; onScanFrame: (frame: ScanFrame) => void; captureRef: RefObject<ScannerCapture | null> };

export function ScannerCamera({ mode, onScanFrame, captureRef }: MockProps) {
  useEffect(() => {
    currentOnFrame = onScanFrame;
  }, [onScanFrame]);
  useImperativeHandle(captureRef, () => ({ capture: () => Promise.resolve(stillFrame) }), []);
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

/** What the next shutter photo will contain (null: the capture failed). */
export function setStillFrame(frame: Partial<ScanFrame> | null): void {
  stillFrame = frame === null ? null : { barcodes: [], lines: [], frameWidth: 0, frameHeight: 0, ...frame };
}

export function setCameraPermission(next: Pick<ScannerPermission, 'granted' | 'canAsk'>): void {
  permission = next;
}

export function resetScannerMock(): void {
  currentOnFrame = null;
  stillFrame = null;
  permission = { granted: true, canAsk: false };
  askPermission.mockClear();
  openSettings.mockClear();
}
