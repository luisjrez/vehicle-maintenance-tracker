import { lineItemName, PROVIDER_TYPE_LABELS } from '@vmt/shared';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { formatCents, formatDate, formatMiles } from '@/shared/format';
import { useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

export function RecordDetailScreen({ recordId }: { recordId: string }) {
  const record = useGarageStore((state) => state.records.find((candidate) => candidate.id === recordId));

  if (record === undefined) {
    return (
      <View style={styles.sheet}>
        <Text style={styles.muted}>{strings.recordDetail.missing}</Text>
      </View>
    );
  }

  const provider = [record.providerName, record.providerType === null ? null : PROVIDER_TYPE_LABELS[record.providerType]]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <ScrollView testID="record-detail" style={styles.sheet} contentContainerStyle={styles.content}>
      <Text style={styles.muted}>{formatDate(record.date)}</Text>
      <Text testID="record-detail-total" selectable style={styles.total}>
        {formatCents(record.totalCents)}
      </Text>
      <Card>
        <Detail label={strings.logWork.odometer} value={record.odometer === null ? '—' : formatMiles(record.odometer)} />
        <Detail label={strings.logWork.provider} value={provider === '' ? '—' : provider} />
      </Card>
      <SectionHeader title={strings.logWork.selectedServices} />
      <Card>
        {record.lineItems.map((item) => (
          <View key={item.id} style={styles.line}>
            <View style={styles.lineText}>
              <Text style={styles.lineName}>{lineItemName(item)}</Text>
              {item.packageCode === null ? null : <Text style={styles.muted}>{item.packageCode}</Text>}
              {item.notes === null ? null : <Text style={styles.muted}>{item.notes}</Text>}
            </View>
            {item.costCents === null ? null : <Text style={styles.lineCost}>{formatCents(item.costCents)}</Text>}
          </View>
        ))}
      </Card>
      {record.notes === null ? null : (
        <>
          <SectionHeader title={strings.logWork.recordNotes} />
          <Card>
            <Text selectable style={styles.notes}>
              {record.notes}
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.muted}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  muted: { fontSize: 13, color: colors.secondaryLabel },
  total: { fontSize: 36, fontWeight: '700', color: colors.label, fontVariant: ['tabular-nums'] },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailValue: { fontSize: 15, color: colors.label, flexShrink: 1, textAlign: 'right' },
  line: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  lineText: { flex: 1, gap: 2 },
  lineName: { fontSize: 16, color: colors.label },
  lineCost: { fontSize: 15, color: colors.label, fontVariant: ['tabular-nums'] },
  notes: { fontSize: 15, color: colors.label },
});
