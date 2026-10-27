import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors } from '@/shared/ui/colors';

type Props = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoCapitalize' | 'maxLength' | 'autoCorrect' | 'onSubmitEditing'
> & {
  label: string;
  error?: string | undefined;
  required?: boolean;
  testID: string;
};

export function TextField({ label, error, required = false, testID, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        placeholderTextColor={colors.secondaryLabel}
        style={[styles.input, error !== undefined && styles.inputError]}
        {...inputProps}
      />
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
  label: { fontSize: 13, color: colors.secondaryLabel, fontWeight: '500' },
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    fontSize: 17,
    color: colors.label,
    backgroundColor: colors.card,
  },
  inputError: { borderWidth: 1, borderColor: colors.destructive },
  error: { fontSize: 13, color: colors.destructive },
});
