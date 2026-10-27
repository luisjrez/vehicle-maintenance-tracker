import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors } from '@/shared/ui/colors';

type Props = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoCapitalize' | 'maxLength' | 'autoCorrect' | 'onSubmitEditing'
> & {
  label: string;
  error?: string | undefined;
  /** A small action next to the label, e.g. "Scan". */
  action?: { title: string; onPress: () => void; testID: string };
  /** Neutral helper text under the input. */
  hint?: string | undefined;
  required?: boolean;
  /** Fixed text inside the box before the value, e.g. "$". */
  prefix?: string;
  testID: string;
};

export function TextField({ label, error, required = false, action, hint, prefix, testID, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Text>
        {action === undefined ? null : (
          <Pressable testID={action.testID} accessibilityRole="button" hitSlop={8} onPress={action.onPress}>
            <Text style={styles.action}>{action.title}</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.box, error !== undefined && styles.inputError]}>
        {prefix === undefined ? null : <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          placeholderTextColor={colors.secondaryLabel}
          style={styles.input}
          {...inputProps}
        />
      </View>
      {hint === undefined || error !== undefined ? null : <Text style={styles.hint}>{hint}</Text>}
      {error === undefined ? null : (
        <Text testID={`${testID}-error`} selectable style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: colors.secondaryLabel, fontWeight: '500' },
  action: { fontSize: 15, color: colors.tint, fontWeight: '600' },
  hint: { fontSize: 13, color: colors.secondaryLabel },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    gap: 2,
    backgroundColor: colors.card,
  },
  prefix: { fontSize: 17, color: colors.secondaryLabel },
  input: { flex: 1, minHeight: 46, fontSize: 17, color: colors.label },
  inputError: { borderWidth: 1, borderColor: colors.destructive },
  error: { fontSize: 13, color: colors.destructive },
});
