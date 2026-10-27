import { type IssuedTransferCode, transferQrPayload } from '@vmt/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { QrCode } from '@/components/qr-code';
import { errorMessage } from '@/shared/api/api-error';
import { issueTransferCode } from '@/shared/api/transfer-api';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

function remaining(expiresAt: string, now: number): string {
  const seconds = Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Shows a single-use, 10-minute transfer QR with a countdown (ADR-0001). */
export function TransferScreen() {
  const t = strings.transfer;
  const [issued, setIssued] = useState<IssuedTransferCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Every new code invalidates the previous one on the server.
      setIssued(await issueTransferCode());
      setNow(Date.now());
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    void generate();
  }, [generate]);

  // The first code is requested on open; state only changes when the request settles.
  useEffect(() => {
    let active = true;
    issueTransferCode().then(
      (code) => {
        if (!active) return;
        setIssued(code);
        setNow(Date.now());
        setLoading(false);
      },
      (failure: unknown) => {
        if (!active) return;
        setError(errorMessage(failure));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const expired = issued !== null && Date.parse(issued.expiresAt) <= now;

  return (
    <ScrollView testID="transfer-screen" style={styles.sheet} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.body}>{t.instructions}</Text>
      <View style={styles.qr}>
        {loading ? <ActivityIndicator /> : null}
        {!loading && issued !== null && !expired ? (
          <QrCode testID="transfer-qr" value={transferQrPayload(issued.code)} size={240} />
        ) : null}
        {!loading && expired ? <Text testID="transfer-expired" style={styles.body}>{t.expired}</Text> : null}
      </View>
      {issued !== null && !expired ? (
        <Text testID="transfer-countdown" style={styles.countdown}>
          {t.expiresIn(remaining(issued.expiresAt, now))}
        </Text>
      ) : null}
      {error === null ? null : <ErrorBanner testID="transfer-error" message={error} onRetry={handleGenerate} />}
      <Text testID="transfer-warning" style={styles.warning}>
        {t.warning}
      </Text>
      <Button testID="transfer-generate" title={t.generateNew} variant="secondary" onPress={handleGenerate} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14, alignItems: 'stretch', paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: colors.label },
  body: { fontSize: 15, color: colors.secondaryLabel },
  qr: { alignItems: 'center', justifyContent: 'center', minHeight: 260 },
  countdown: { fontSize: 15, color: colors.label, textAlign: 'center', fontVariant: ['tabular-nums'] },
  warning: { fontSize: 15, color: colors.destructive, fontWeight: '600' },
});
