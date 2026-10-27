import { useLocalSearchParams } from 'expo-router';
import { ScannerScreen } from '@/features/scanner/scanner-screen';
import { isScanMode } from '@/shared/scanner/scan-types';

export default function ScannerRoute() {
  const { mode, free } = useLocalSearchParams<{ mode?: string; free?: string }>();
  return <ScannerScreen initialMode={isScanMode(mode) ? mode : 'qr'} locked={free !== '1'} />;
}
