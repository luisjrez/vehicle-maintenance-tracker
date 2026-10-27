import { type ServiceRecord, spendingReport } from '@vmt/shared';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { formatCents } from '@/shared/format';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

const ALL_TIME = 'all';

type Props = { records: ServiceRecord[] };

/** Basic per-vehicle spending (v1 scope edges): year chips, a total and per-category bars. */
export function SpendingReportCard({ records }: Props) {
  const t = strings.garage;
  const [selection, setSelection] = useState<string>(ALL_TIME);
  const years = useMemo(() => spendingReport(records).years, [records]);
  const year = selection === ALL_TIME || !years.includes(Number(selection)) ? undefined : Number(selection);
  const report = useMemo(() => spendingReport(records, year), [records, year]);
  const largest = report.categories[0]?.cents ?? 0;

  const select = useCallback((value: string) => setSelection(value), []);

  return (
    <View testID="spending-report" style={styles.section}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip testID="spending-year-all" label={t.allTime} value={ALL_TIME} selected={year === undefined} onToggle={select} />
        {years.map((candidate) => (
          <Chip
            key={candidate}
            testID={`spending-year-${candidate}`}
            label={String(candidate)}
            value={String(candidate)}
            selected={year === candidate}
            onToggle={select}
          />
        ))}
      </ScrollView>
      <Card>
        <Text style={styles.caption}>{year === undefined ? t.lifetimeTotal : t.yearTotal(year)}</Text>
        <Text testID="spending-total" selectable style={styles.total}>
          {formatCents(report.totalCents)}
        </Text>
        {report.categories.length === 0 ? <Text style={styles.caption}>{t.noSpending}</Text> : null}
        {report.categories.map((category) => (
          <View key={category.slug} testID={`spending-category-${category.slug}`} style={styles.bar}>
            <View style={styles.barLabels}>
              <Text style={styles.barName}>{category.name}</Text>
              <Text style={styles.barAmount}>{formatCents(category.cents)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${largest === 0 ? 0 : (category.cents / largest) * 100}%` }]} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  chips: { gap: 8 },
  caption: { fontSize: 13, color: colors.secondaryLabel },
  total: { fontSize: 28, fontWeight: '700', color: colors.label, fontVariant: ['tabular-nums'] },
  bar: { gap: 4, paddingTop: 6 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  barName: { fontSize: 15, color: colors.label, flexShrink: 1 },
  barAmount: { fontSize: 15, color: colors.label, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.fill, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.tint },
});
