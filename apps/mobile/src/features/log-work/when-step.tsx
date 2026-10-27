import { PROVIDER_TYPE_LABELS, PROVIDER_TYPES, type ProviderType } from '@vmt/shared';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { SectionHeader } from '@/components/section-header';
import { TextField } from '@/components/text-field';
import { strings } from '@/shared/strings';
import type { DraftErrors } from './draft-to-input';
import { useLogWorkDraft } from './log-work-draft';

type Props = { errors: DraftErrors };

export function WhenStep({ errors }: Props) {
  const t = strings.logWork;
  const date = useLogWorkDraft((state) => state.date);
  const odometer = useLogWorkDraft((state) => state.odometer);
  const providerName = useLogWorkDraft((state) => state.providerName);
  const providerType = useLogWorkDraft((state) => state.providerType);
  const setField = useLogWorkDraft((state) => state.setField);
  const setProviderType = useLogWorkDraft((state) => state.setProviderType);
  // The picker's upper bound; fixed when the sheet opens, the save re-checks against today.
  const [today] = useState(() => new Date());

  const setDate = useCallback((value: string) => setField('date', value), [setField]);
  const setOdometer = useCallback((value: string) => setField('odometer', value), [setField]);
  const setProviderName = useCallback((value: string) => setField('providerName', value), [setField]);
  const toggleProviderType = useCallback(
    (value: ProviderType) => setProviderType(providerType === value ? null : value),
    [providerType, setProviderType],
  );

  return (
    <View testID="log-work-step-when" style={styles.step}>
      <DateField testID="log-work-date" label={t.date} value={date} onChange={setDate} maximumDate={today} error={errors.date} />
      <TextField
        testID="log-work-odometer"
        label={t.odometer}
        placeholder={t.odometerHint}
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="number-pad"
        maxLength={9}
        error={errors.odometer}
      />
      <SectionHeader title={t.provider} />
      <TextField testID="log-work-provider-name" label={t.providerName} value={providerName} onChangeText={setProviderName} error={errors.providerName} />
      <View style={styles.chips}>
        {PROVIDER_TYPES.map((type) => (
          <Chip
            key={type}
            testID={`provider-type-${type}`}
            label={PROVIDER_TYPE_LABELS[type]}
            value={type}
            selected={providerType === type}
            onToggle={toggleProviderType}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
