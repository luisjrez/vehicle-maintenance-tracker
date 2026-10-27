// The only module that touches VisionCamera and ML Kit (ADR-0006). Jest replaces
// it with a JS mock (see jest.setup.ts), and a custom native module could
// replace it without changing the scanner screen.
import { useCallback } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Camera, CommonResolutions, useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera';
import { type BarcodeFormat, useBarcodeScanning, useTextRecognition } from 'react-native-vision-camera-mlkit';
import { scheduleOnRN } from 'react-native-worklets';
import type { ScanFrame, ScanMode, ScannedBarcode, ScannedTextLine } from '@/shared/scanner/scan-types';

// Door-jamb stickers use Code 39 / Code 128 / Data Matrix; transfer codes are QR.
const VIN_FORMATS: BarcodeFormat[] = ['CODE_39', 'CODE_128', 'DATA_MATRIX'];
const QR_FORMATS: BarcodeFormat[] = ['QR_CODE'];

export type ScannerPermission = {
  granted: boolean;
  canAsk: boolean;
  ask: () => Promise<boolean>;
  openSettings: () => Promise<void>;
};

export function useScannerPermission(): ScannerPermission {
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const openSettings = useCallback(() => Linking.openSettings(), []);
  return { granted: hasPermission, canAsk: canRequestPermission, ask: requestPermission, openSettings };
}

type Props = {
  mode: ScanMode;
  torch: boolean;
  active: boolean;
  onFrame: (frame: ScanFrame) => void;
};

/** False on devices without a back camera, such as the iOS simulator. */
export function useBackCameraAvailable(): boolean {
  return useCameraDevice('back') !== undefined;
}

export function ScannerCamera({ mode, torch, active, onFrame }: Props) {
  const device = useCameraDevice('back');
  const { barcodeScanning } = useBarcodeScanning({ formats: mode === 'qr' ? QR_FORMATS : VIN_FORMATS });
  const { textRecognition } = useTextRecognition({ language: 'LATIN' });
  const wantsBarcodes = mode !== 'odometer';
  const wantsText = mode !== 'qr';

  const frameOutput = useFrameOutput({
    targetResolution: CommonResolutions.HD_16_9,
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      // Never let anything escape a frame callback: on iOS release builds an
      // exception there kills the process (VisionCamera #4219).
      try {
        const barcodes: ScannedBarcode[] = [];
        if (wantsBarcodes) {
          for (const code of barcodeScanning(frame, { outputOrientation: 'portrait' }).barcodes) {
            if (code.rawValue !== null) barcodes.push({ format: code.formatName, value: code.rawValue });
          }
        }
        const lines: ScannedTextLine[] = [];
        if (wantsText) {
          for (const block of textRecognition(frame, { outputOrientation: 'portrait' }).blocks) {
            for (const line of block.lines) {
              lines.push({
                text: line.text,
                top: line.bounds.top,
                left: line.bounds.left,
                width: line.bounds.width,
                height: line.bounds.height,
              });
            }
          }
        }
        scheduleOnRN(onFrame, { barcodes, lines, frameWidth: frame.width, frameHeight: frame.height });
      } catch {
        // Drop the frame; the next one will try again.
      } finally {
        frame.dispose();
      }
    },
  });

  if (device === undefined) return null;
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={active}
      outputs={[frameOutput]}
      torchMode={torch ? 'on' : 'off'}
    />
  );
}
