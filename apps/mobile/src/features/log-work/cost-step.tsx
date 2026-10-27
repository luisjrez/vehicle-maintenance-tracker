import { formatDollarInput } from '@vmt/shared';
import { useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SectionHeader } from '@/components/section-header';
import { TextField } from '@/components/text-field';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import type { DraftErrors } from './draft-to-input';
import { useLogWorkDraft } from '@/shared/log-work-draft/log-work-draft';
import { LineCostRow } from './line-cost-row';

type Props = { errors: DraftErrors };

export function CostStep({ errors }: Props) {
  const t = strings.logWork;
  const total = useLogWorkDraft((state) => state.total);
  const notes = useLogWorkDraft((state) => state.notes);
  const lineItems = useLogWorkDraft((state) => state.lineItems);
  const setField = useLogWorkDraft((state) => state.setField);
  const updateLineItem = useLogWorkDraft((state) => state.updateLineItem);

  const setTotal = useCallback((value: string) => setField('total', formatDollarInput(value)), [setField]);
  const setNotes = useCallback((value: string) => setField('notes', value), [setField]);

  return (
    <View testID="log-work-step-cost" style={styles.step}>
      <Text style={styles.label}>{`${t.totalPaid} *`}</Text>
      <View style={[styles.totalBox, errors.totalCents !== undefined && styles.totalError]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          testID="log-work-total"
          accessibilityLabel={t.totalPaid}
          value={total}
          onChangeText={setTotal}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.secondaryLabel}
          style={styles.totalInput}
        />
      </View>
      {errors.totalCents === undefined ? (
        <Text style={styles.hint}>{t.totalHint}</Text>
      ) : (
        <Text testID="log-work-total-error" style={styles.error}>
          {errors.totalCents}
        </Text>
      )}
      <SectionHeader title={strings.logWork.selectedServices} />
      {lineItems.map((item, index) => (
        <LineCostRow key={item.key} item={item} index={index} errors={errors} onChange={updateLineItem} />
      ))}
      <TextField testID="log-work-notes" label={t.recordNotes} value={notes} onChangeText={setNotes} error={errors.notes} />
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 12 },
  label: { fontSize: 13, color: colors.secondaryLabel, fontWeight: '500' },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    minHeight: 72,
  },
  totalError: { borderWidth: 1, borderColor: colors.destructive },
  currency: { fontSize: 34, fontWeight: '700', color: colors.secondaryLabel },
  totalInput: { flex: 1, fontSize: 34, fontWeight: '700', color: colors.label, fontVariant: ['tabular-nums'], paddingLeft: 4 },
  hint: { fontSize: 13, color: colors.secondaryLabel },
  error: { fontSize: 13, color: colors.destructive },
});
