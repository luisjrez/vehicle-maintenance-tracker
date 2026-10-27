import { useLocalSearchParams } from 'expo-router';
import { ScannerScreen } from '@/features/scanner/scanner-screen';
import type { ScanMode } from '@/shared/scanner/scan-types';

function isScanMode(value: unknown): value is ScanMode {
  return value === 'vin' || value === 'odometer' || value === 'qr';
}

export default function ScannerRoute() {
  const { mode, free } = useLocalSearchParams<{ mode?: string; free?: string }>();
  return <ScannerScreen initialMode={isScanMode(mode) ? mode : 'qr'} locked={free !== '1'} />;
}
