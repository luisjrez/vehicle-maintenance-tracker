import type { ServiceRecord } from '@vmt/shared';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { HistoryRow } from './history-row';

type Props = { records: ServiceRecord[]; onOpen: (recordId: string) => void };

export function HistoryList({ records, onOpen }: Props) {
  if (records.length === 0) {
    return (
      <View testID="history-empty" style={styles.card}>
        <Text style={styles.empty}>{strings.garage.historyEmpty}</Text>
      </View>
    );
  }
  return (
    <View testID="history-list" style={styles.card}>
      {records.map((record, index) => (
        <Fragment key={record.id}>
          {index === 0 ? null : <View style={styles.separator} />}
          <HistoryRow record={record} onOpen={onOpen} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, borderCurve: 'continuous', overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 16 },
  empty: { padding: 16, color: colors.secondaryLabel, fontSize: 15 },
});
