import { lineItemName, SCHEDULED_MAINTENANCE_SLUG } from '@vmt/shared';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/components/text-field';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import type { DraftLineItem, LineItemField } from '@/shared/log-work-draft/log-work-draft';

type Props = {
  item: DraftLineItem;
  index: number;
  errors: Partial<Record<string, string>>;
  onChange: (key: string, field: LineItemField, value: string) => void;
};

export function LineCostRow({ item, index, errors, onChange }: Props) {
  const t = strings.logWork;
  const setCost = useCallback((value: string) => onChange(item.key, 'cost', value), [onChange, item.key]);
  const setNotes = useCallback((value: string) => onChange(item.key, 'notes', value), [onChange, item.key]);
  const setPackage = useCallback((value: string) => onChange(item.key, 'packageCode', value), [onChange, item.key]);

  return (
    <View style={styles.row}>
      <Text style={styles.name}>{lineItemName(item)}</Text>
      {item.serviceSlug === SCHEDULED_MAINTENANCE_SLUG ? (
        <TextField testID={`line-package-${index}`} label={t.packageCode} value={item.packageCode} onChangeText={setPackage} error={errors[`lineItems.${index}.packageCode`]} />
      ) : null}
      <TextField testID={`line-cost-${index}`} label={t.lineCost} value={item.cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="$0.00" error={errors[`lineItems.${index}.costCents`]} />
      <TextField testID={`line-notes-${index}`} label={t.lineNotes} value={item.notes} onChangeText={setNotes} error={errors[`lineItems.${index}.notes`]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingTop: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.label },
});
