import { useRouter } from 'expo-router';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { useScanRequestStore } from '@/shared/scanner/scan-request-store';
import type { ScanFrame, ScanMode } from '@/shared/scanner/scan-types';
import { strings } from '@/shared/strings';
import { ScannerCamera, useBackCameraAvailable, useScannerPermission } from './scanner-camera';
import { ScannerGuide } from './scanner-overlay';

const MODES: ScanMode[] = ['vin', 'odometer', 'qr'];

type Props = {
  initialMode: ScanMode;
  /** Opened for a specific field: other modes are shown but cannot be picked. */
  locked: boolean;
};

/** One full-screen scanner with VIN / Odometer / Transfer QR modes (ADR-0006). */
export function ScannerScreen({ initialMode, locked }: Props) {
  const t = strings.scanner;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permission = useScannerPermission();
  const cameraAvailable = useBackCameraAvailable();
  const deliver = useScanRequestStore((state) => state.deliver);
  const [mode, setMode] = useState(initialMode);
  const [torch, setTorch] = useState(false);
  const [done, setDone] = useState(false);
  // Frames arrive faster than React re-renders; the ref makes delivery happen once.
  const delivered = useRef(false);

  const close = useCallback(() => router.back(), [router]);
  const toggleTorch = useCallback(() => setTorch((on) => !on), []);
  const askPermission = useCallback(() => {
    void permission.ask();
  }, [permission]);
  const openSettings = useCallback(() => {
    void permission.openSettings();
  }, [permission]);

  const finish = useCallback(
    (value: string) => {
      if (delivered.current) return;
      delivered.current = true;
      setDone(true);
      deliver(value);
      router.back();
    },
    [deliver, router],
  );

  const handleFrame = useCallback(
    (frame: ScanFrame) => {
      if (mode !== 'qr') return;
      const qr = frame.barcodes.find((barcode) => barcode.format === 'QR_CODE');
      if (qr !== undefined) finish(qr.value);
    },
    [mode, finish],
  );

  let body: ReactNode;
  if (!permission.granted) {
    body = (
      <View testID="scanner-permission" style={styles.message}>
        <Text style={styles.title}>{t.permissionTitle}</Text>
        <Text style={styles.body}>{t.permissionBody}</Text>
        {permission.canAsk ? (
          <Button testID="scanner-allow" title={t.allow} onPress={askPermission} />
        ) : (
          <Button testID="scanner-open-settings" title={t.openSettings} onPress={openSettings} />
        )}
      </View>
    );
  } else if (!cameraAvailable) {
    body = (
      <View testID="scanner-no-camera" style={styles.message}>
        <Text style={styles.body}>{t.noCamera}</Text>
      </View>
    );
  } else {
    body = (
      <>
        <ScannerCamera mode={mode} torch={torch} active={!done} onFrame={handleFrame} />
        <ScannerGuide mode={mode} />
      </>
    );
  }

  return (
    <View testID="scanner-screen" style={styles.screen}>
      {body}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={styles.segments}>
          {MODES.map((candidate) => (
            <ModeSegment
              key={candidate}
              mode={candidate}
              selected={candidate === mode}
              disabled={locked && candidate !== initialMode}
              onSelect={setMode}
            />
          ))}
        </View>
        <Text style={styles.hint}>{t.hints[mode]}</Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {mode === 'qr' ? null : (
          <Pressable testID="scanner-torch" accessibilityRole="switch" accessibilityState={{ checked: torch }} onPress={toggleTorch}>
            <Text style={styles.control}>{torch ? t.torchOn : t.torchOff}</Text>
          </Pressable>
        )}
        <Pressable testID="scanner-type-instead" accessibilityRole="button" onPress={close}>
          <Text style={styles.control}>{mode === 'qr' ? t.close : t.typeInstead}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type SegmentProps = { mode: ScanMode; selected: boolean; disabled: boolean; onSelect: (mode: ScanMode) => void };

function ModeSegment({ mode, selected, disabled, onSelect }: SegmentProps) {
  const handlePress = useCallback(() => onSelect(mode), [onSelect, mode]);
  return (
    <Pressable
      testID={`scanner-mode-${mode}`}
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[styles.segment, selected && styles.segmentSelected, disabled && styles.segmentDisabled]}
    >
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{strings.scanner.modes[mode]}</Text>
    </Pressable>
  );
}

// The camera is always dark, so the chrome uses fixed light-on-dark colors.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 12, alignItems: 'center' },
  segments: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 2 },
  segment: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  segmentSelected: { backgroundColor: '#ffffff' },
  segmentDisabled: { opacity: 0.4 },
  segmentLabel: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  segmentLabelSelected: { color: '#000000' },
  hint: { color: '#ffffff', fontSize: 15, textAlign: 'center', textShadowColor: '#000000', textShadowRadius: 4 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16 },
  control: { color: '#ffffff', fontSize: 17, fontWeight: '600', padding: 8 },
  message: { flex: 1, justifyContent: 'center', padding: 32, gap: 16 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { color: '#d1d5db', fontSize: 16, textAlign: 'center' },
});
