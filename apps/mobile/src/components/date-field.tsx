import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate } from '@/shared/format';
import { colors } from '@/shared/ui/colors';

type Props = {
  label: string;
  /** `YYYY-MM-DD` */
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: Date;
  error?: string | undefined;
  testID: string;
};

/** Calendar dates travel as `YYYY-MM-DD`; the picker works in local midnight Dates. */
function toLocalDate(isoDate: string): Date {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function DateField({ label, value, onChange, maximumDate, error, testID }: Props) {
  const handleChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set' && date !== undefined) onChange(toIsoDate(date));
    },
    [onChange],
  );

  const openAndroidPicker = useCallback(() => {
    DateTimePickerAndroid.open({ value: toLocalDate(value), mode: 'date', maximumDate, onChange: handleChange });
  }, [value, maximumDate, handleChange]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <View style={styles.iosRow}>
          <DateTimePicker
            testID={testID}
            value={toLocalDate(value)}
            mode="date"
            display="compact"
            maximumDate={maximumDate}
            onChange={handleChange}
          />
        </View>
      ) : (
        <Pressable testID={testID} accessibilityRole="button" onPress={openAndroidPicker} style={styles.androidButton}>
          <Text style={styles.value}>{formatDate(value)}</Text>
        </Pressable>
      )}
      {error === undefined ? null : (
        <Text testID={`${testID}-error`} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, color: colors.secondaryLabel, fontWeight: '500' },
  iosRow: { alignItems: 'flex-start' },
  androidButton: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  value: { fontSize: 17, color: colors.label },
  error: { fontSize: 13, color: colors.destructive },
});
