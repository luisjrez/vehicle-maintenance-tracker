import { StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/ui/colors';

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.header}>{title.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  header: { fontSize: 13, color: colors.secondaryLabel, fontWeight: '600', paddingHorizontal: 4, paddingTop: 8 },
});
