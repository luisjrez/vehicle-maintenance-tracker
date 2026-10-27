// The only module that touches VisionCamera and ML Kit (ADR-0006). Jest replaces
// it with a JS mock (see jest.setup.ts), and a custom native module could
// replace it without changing the scanner screen.
import { type RefObject, useCallback, useImperativeHandle } from 'react';
import { Linking, Platform, StyleSheet } from 'react-native';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  usePhotoOutput,
} from 'react-native-vision-camera';
import {
  type BarcodeFormat,
  processImageBarcodeScanning,
  processImageTextRecognition,
  type TextRecognitionOptions,
  type TextRecognitionResult,
  useBarcodeScanning,
  useTextRecognition,
} from 'react-native-vision-camera-mlkit';
import { scheduleOnRN } from 'react-native-worklets';
import type { ScanFrame, ScanMode, ScannedBarcode, ScannedTextLine } from '@/shared/scanner/scan-types';

// Door-jamb stickers use Code 39 / Code 128 / Data Matrix; transfer codes are QR.
const VIN_FORMATS: BarcodeFormat[] = ['CODE_39', 'CODE_128', 'DATA_MATRIX'];
const QR_FORMATS: BarcodeFormat[] = ['QR_CODE'];
// The plugin memoizes its native recognizer on the options object's identity,
// so options live at module level: an inline literal builds one per render.
const VIN_BARCODES = { formats: VIN_FORMATS };
const QR_BARCODES = { formats: QR_FORMATS };
const ODOMETER_TEXT: TextRecognitionOptions = { language: 'LATIN' };
/**
 * VIN mode reads only a band around the guide box (~8 % of the screen height,
 * centred), so text elsewhere on the windshield — like the glass maker's
 * "DOT… AS1 M…" stamp — never reaches the parser. iOS crops the sensor's
 * landscape buffer before rotating, where the screen's vertical axis is x;
 * Android rotates first, so it is y. The band is centred, so the direction of
 * the rotation does not matter.
 */
const VIN_BAND = { start: 0.4, size: 0.2 };
const VIN_TEXT: TextRecognitionOptions = {
  language: 'LATIN',
  roi:
    Platform.OS === 'ios'
      ? { x: VIN_BAND.start, y: 0, width: VIN_BAND.size, height: 1 }
      : { x: 0, y: VIN_BAND.start, width: 1, height: VIN_BAND.size },
};

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

/** Takes a full-resolution still and reads it once: the shutter fallback. */
export type ScannerCapture = { capture: () => Promise<ScanFrame | null> };

type Props = {
  mode: ScanMode;
  torch: boolean;
  active: boolean;
  onScanFrame: (frame: ScanFrame) => void;
  captureRef: RefObject<ScannerCapture | null>;
};

function textLines(result: TextRecognitionResult): ScannedTextLine[] {
  return result.blocks.flatMap((block) =>
    block.lines.map((line) => ({
      text: line.text,
      top: line.bounds.top,
      left: line.bounds.left,
      width: line.bounds.width,
      height: line.bounds.height,
    })),
  );
}

/** False on devices without a back camera, such as the iOS simulator. */
export function useBackCameraAvailable(): boolean {
  return useCameraDevice('back') !== undefined;
}

export function ScannerCamera({ mode, torch, active, onScanFrame, captureRef }: Props) {
  const device = useCameraDevice('back');
  const { barcodeScanning } = useBarcodeScanning(mode === 'qr' ? QR_BARCODES : VIN_BARCODES);
  const { textRecognition } = useTextRecognition(mode === 'vin' ? VIN_TEXT : ODOMETER_TEXT);
  const wantsBarcodes = mode !== 'odometer';
  const wantsText = mode !== 'qr';
  const photoOutput = usePhotoOutput({ qualityPrioritization: 'speed' });

  useImperativeHandle(
    captureRef,
    () => ({
      capture: async () => {
        try {
          const { filePath } = await photoOutput.capturePhotoToFile({ enableShutterSound: false }, {});
          const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
          const [text, codes] = await Promise.all([
            wantsText ? processImageTextRecognition(uri, { language: 'LATIN' }) : Promise.resolve(null),
            wantsBarcodes ? processImageBarcodeScanning(uri, { formats: mode === 'qr' ? QR_FORMATS : VIN_FORMATS }) : Promise.resolve(null),
          ]);
          const barcodes = (codes?.barcodes ?? []).flatMap((code): ScannedBarcode[] =>
            code.rawValue === null ? [] : [{ format: code.formatName, value: code.rawValue }],
          );
          return { barcodes, lines: text === null ? [] : textLines(text), frameWidth: 0, frameHeight: 0 };
        } catch {
          return null;
        }
      },
    }),
    [photoOutput, wantsText, wantsBarcodes, mode],
  );

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
        scheduleOnRN(onScanFrame, { barcodes, lines, frameWidth: frame.width, frameHeight: frame.height });
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
      outputs={[frameOutput, photoOutput]}
      torchMode={torch ? 'on' : 'off'}
    />
  );
}
