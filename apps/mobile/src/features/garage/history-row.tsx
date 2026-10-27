import { lineItemName, PROVIDER_TYPE_LABELS, type ServiceRecord } from '@vmt/shared';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCents, formatDate, formatMiles } from '@/shared/format';
import { colors } from '@/shared/ui/colors';

type Props = { record: ServiceRecord; onOpen: (recordId: string) => void };

export function HistoryRow({ record, onOpen }: Props) {
  const handlePress = useCallback(() => onOpen(record.id), [onOpen, record.id]);
  const services = record.lineItems.map(lineItemName).join(', ');
  const provider = record.providerName ?? (record.providerType === null ? null : PROVIDER_TYPE_LABELS[record.providerType]);
  const meta = [formatDate(record.date), record.odometer === null ? null : formatMiles(record.odometer), provider]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <Pressable testID={`history-row-${record.id}`} accessibilityRole="button" onPress={handlePress} style={styles.row}>
      <View style={styles.text}>
        <Text numberOfLines={2} style={styles.title}>
          {services}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {meta}
        </Text>
      </View>
      <Text style={styles.total}>{formatCents(record.totalCents)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', color: colors.label },
  meta: { fontSize: 13, color: colors.secondaryLabel },
  total: { fontSize: 16, fontWeight: '700', color: colors.label, fontVariant: ['tabular-nums'] },
});
