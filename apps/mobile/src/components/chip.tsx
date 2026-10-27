import { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/ui/colors';

type Props<T extends string> = {
  label: string;
  value: T;
  selected: boolean;
  onToggle: (value: T) => void;
  testID?: string;
};

/** A selectable pill; it reports its own value so lists never need inline handlers. */
export function Chip<T extends string>({ label, value, selected, onToggle, testID }: Props<T>) {
  const handlePress = useCallback(() => onToggle(value), [onToggle, value]);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  selected: { backgroundColor: colors.label, borderColor: colors.label },
  label: { fontSize: 15, color: colors.label },
  selectedLabel: { color: colors.background, fontWeight: '600' },
});
