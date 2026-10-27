import { StyleSheet, View } from 'react-native';
import type { ScanMode } from '@/shared/scanner/scan-types';

// Guide boxes per mode, as fractions of the screen width: a VIN is one long
// line, an odometer a wide 2:1 window (odometer decision 2), a QR a square.
const GUIDES: Record<ScanMode, { width: number; aspectRatio: number }> = {
  vin: { width: 0.88, aspectRatio: 5 },
  odometer: { width: 0.8, aspectRatio: 2 },
  qr: { width: 0.7, aspectRatio: 1 },
};

export function ScannerGuide({ mode }: { mode: ScanMode }) {
  const guide = GUIDES[mode];
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View testID={`scanner-guide-${mode}`} style={[styles.box, { width: `${guide.width * 100}%`, aspectRatio: guide.aspectRatio }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  box: { borderWidth: 3, borderColor: '#ffffff', borderRadius: 14, borderCurve: 'continuous' },
});
