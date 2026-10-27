import { Pressable, StyleSheet, Text, View } from 'react-native';
import { strings } from '@/shared/strings';
import { useApiHealth, type ApiHealth } from './use-api-health';

const label: Record<ApiHealth, string> = {
  checking: strings.health.checking,
  ok: strings.health.ok,
  unreachable: strings.health.unreachable,
};

export function ApiHealthStatus() {
  const { health, recheck } = useApiHealth();

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{strings.health.title}</Text>
      <Text testID="api-health-status" style={[styles.value, health === 'unreachable' && styles.error]}>
        {label[health]}
      </Text>
      {health === 'unreachable' ? (
        <Pressable testID="api-health-retry" accessibilityRole="button" onPress={recheck}>
          <Text style={styles.link}>{strings.health.retry}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4, alignItems: 'center' },
  title: { fontSize: 13, color: '#6b7280' },
  value: { fontSize: 17, fontWeight: '600' },
  error: { color: '#dc2626' },
  link: { color: '#2563eb', fontSize: 15 },
});
