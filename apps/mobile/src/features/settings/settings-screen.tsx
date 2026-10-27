import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ErrorBanner } from '@/components/error-banner';
import { ListRow } from '@/components/list-row';
import { useScanner } from '@/shared/scanner/use-scanner';
import { strings } from '@/shared/strings';
import { useReceiveTransfer } from '@/shared/transfer/use-receive-transfer';
import { colors } from '@/shared/ui/colors';
import { ApiHealthStatus } from './api-health-status';

export function SettingsScreen() {
  const t = strings.settings;
  const router = useRouter();
  const receive = useReceiveTransfer();
  const openTransfer = useCallback(() => router.push('/transfer'), [router]);

  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text testID="settings-no-account" style={styles.body}>
        {t.noAccount}
      </Text>
      <ListRow testID="settings-transfer" title={t.transfer} onPress={openTransfer} />
      <ListRow testID="settings-receive" title={t.receive} onPress={receive.start} />
      {receive.busy ? <ActivityIndicator testID="settings-receive-busy" /> : null}
      {receive.message === null ? null : (
        <Text testID="settings-receive-done" style={styles.done}>
          {receive.message}
        </Text>
      )}
      {receive.error === null ? null : <ErrorBanner testID="settings-receive-error" message={receive.error} />}
      <Card>
        <ApiHealthStatus />
      </Card>
      {__DEV__ ? <ScannerDebug /> : null}
    </ScrollView>
  );
}

/** Development-only entry point to exercise the scanner's QR mode end to end. */
function ScannerDebug() {
  const [lastScan, setLastScan] = useState<string | null>(null);
  const showScan = useCallback((value: string) => setLastScan(value), []);
  const openScanner = useScanner('qr', showScan);
  return (
    <Card testID="scanner-debug">
      <Button testID="scanner-debug-open" title="Scan a QR code (debug)" variant="secondary" onPress={openScanner} />
      <Text testID="scanner-debug-result" selectable style={styles.debug}>
        {lastScan ?? '—'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  body: { fontSize: 15, color: colors.secondaryLabel, paddingHorizontal: 4 },
  done: { fontSize: 15, color: colors.tint, textAlign: 'center' },
  debug: { fontSize: 13, color: colors.secondaryLabel, fontFamily: 'Menlo' },
});
