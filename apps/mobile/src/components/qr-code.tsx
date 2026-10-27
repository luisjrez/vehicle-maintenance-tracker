import { create } from 'qrcode';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = { value: string; size: number; testID?: string };

/**
 * Draws a QR code with plain Views: no SVG dependency, and the matrix for a
 * transfer code is small (about 33×33 modules).
 */
export const QrCode = memo(function QrCode({ value, size, testID }: Props) {
  const rows = useMemo(() => {
    const { modules } = create(value, { errorCorrectionLevel: 'M' });
    return Array.from({ length: modules.size }, (_, row) =>
      Array.from({ length: modules.size }, (__, column) => modules.get(row, column) === 1),
    );
  }, [value]);
  const quiet = 4; // modules of white border scanners expect
  // Whole-point cells: fractional sizes leave seams that break decoding.
  const cell = Math.max(2, Math.floor(size / (rows.length + quiet * 2)));
  const side = cell * (rows.length + quiet * 2);

  return (
    <View testID={testID} accessibilityRole="image" style={[styles.frame, { width: side, height: side, padding: cell * quiet }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((dark, columnIndex) => (
            <View key={columnIndex} style={{ width: cell, height: cell, backgroundColor: dark ? '#000000' : '#ffffff' }} />
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { backgroundColor: '#ffffff', borderRadius: 12 },
  row: { flexDirection: 'row' },
});
