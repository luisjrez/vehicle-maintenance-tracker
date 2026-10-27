import { lineItemName } from '@vmt/shared';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import type { DraftLineItem } from '@/shared/log-work-draft/log-work-draft';

type Props = { item: DraftLineItem; onRemove: (key: string) => void };

export function SelectedServiceRow({ item, onRemove }: Props) {
  const handleRemove = useCallback(() => onRemove(item.key), [onRemove, item.key]);
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.name}>{lineItemName(item)}</Text>
        {item.notes === '' ? null : <Text style={styles.notes}>{item.notes}</Text>}
      </View>
      <Pressable testID={`remove-line-${item.key}`} accessibilityRole="button" hitSlop={8} onPress={handleRemove}>
        <Text style={styles.remove}>{strings.logWork.remove}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  text: { flex: 1 },
  name: { fontSize: 16, color: colors.label },
  notes: { fontSize: 13, color: colors.secondaryLabel },
  remove: { color: colors.destructive, fontSize: 15 },
});
