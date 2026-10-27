import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/ui/colors';

type Props = { title: string; onPress: () => void; testID: string; bold?: boolean };

export function HeaderButton({ title, onPress, testID, bold = false }: Props) {
  return (
    <Pressable testID={testID} accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <Text style={[styles.title, bold && styles.bold]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, color: colors.tint },
  bold: { fontWeight: '600' },
});
