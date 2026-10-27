import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/ui/colors';

type Props = { title: string; onPress: () => void; testID: string };

/** A single tappable row with a disclosure chevron. */
export function ListRow({ title, onPress, testID }: Props) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  title: { fontSize: 16, color: colors.label },
  chevron: { fontSize: 22, color: colors.secondaryLabel },
});
