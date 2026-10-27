import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/shared/ui/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, testID }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[styles.base, variantStyles[variant], inactive && styles.inactive]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onTint : colors.tint} />
      ) : (
        <Text style={[styles.title, variant === 'primary' ? styles.primaryTitle : variantTitle[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inactive: { opacity: 0.5 },
  title: { fontSize: 17, fontWeight: '600' },
  primaryTitle: { color: colors.onTint },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.tint },
  secondary: { backgroundColor: colors.fill },
  destructive: { backgroundColor: colors.fill },
});

const variantTitle = StyleSheet.create({
  primary: { color: colors.onTint },
  secondary: { color: colors.tint },
  destructive: { color: colors.destructive },
});
