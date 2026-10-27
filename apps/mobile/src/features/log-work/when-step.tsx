import { odometerBounds, PROVIDER_TYPE_LABELS, PROVIDER_TYPES, type ProviderType } from '@vmt/shared';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { SectionHeader } from '@/components/section-header';
import { TextField } from '@/components/text-field';
import { useScanner } from '@/shared/scanner/use-scanner';
import { useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import type { DraftErrors } from './draft-to-input';
import { useLogWorkDraft } from '@/shared/log-work-draft/log-work-draft';

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
  const [scanned, setScanned] = useState(false);
  const fillScannedOdometer = useCallback(
    (value: string) => {
      setField('odometer', value);
      setScanned(true);
    },
    [setField],
  );
  const scanOdometer = useScanner('odometer', fillScannedOdometer);
  const openOdometerScanner = useCallback(() => {
    // Rank readings by what fits the log for this date (ADR-0007); out-of-range ones are still shown.
    const { vehicles, records } = useGarageStore.getState();
    const { vehicleId, recordId, date: draftDate } = useLogWorkDraft.getState();
    const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
    const bounds =
      vehicle === undefined
        ? undefined
        : odometerBounds(vehicle, records.filter((record) => record.vehicleId === vehicle.id), draftDate, recordId ?? undefined);
    scanOdometer({ odometerBounds: bounds });
  }, [scanOdometer]);

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
        hint={scanned ? strings.scan.checkIt : undefined}
        action={{ title: strings.scan.action, onPress: openOdometerScanner, testID: 'log-work-odometer-scan' }}
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
