import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { ApiError, errorMessage } from '@/shared/api/api-error';
import { createRecord, updateRecord } from '@/shared/api/records-api';
import { useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { CostStep } from './cost-step';
import { buildRecordInput, type DraftErrors, odometerConsistencyError, stepErrors } from './draft-to-input';
import { useLogWorkDraft } from '@/shared/log-work-draft/log-work-draft';
import { WhatStep } from './what-step';
import { WhenStep } from './when-step';

const CONTENT_BOTTOM_PADDING = 32;

const STEP_TITLES = { 1: strings.logWork.whatTitle, 2: strings.logWork.whenTitle, 3: strings.logWork.costTitle } as const;

/** The 3-step "Log work" wizard (flows decision: variant B), shown as a native sheet. */
export function LogWorkScreen({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const draftVehicleId = useLogWorkDraft((state) => state.vehicleId);
  const recordId = useLogWorkDraft((state) => state.recordId);
  const step = useLogWorkDraft((state) => state.step);
  const start = useLogWorkDraft((state) => state.start);
  const setStep = useLogWorkDraft((state) => state.setStep);
  const reset = useLogWorkDraft((state) => state.reset);
  const upsertRecord = useGarageStore((state) => state.upsertRecord);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Callers normally start the draft before opening the sheet; a deep link starts it here.
  useEffect(() => {
    if (draftVehicleId !== vehicleId) start({ vehicleId });
  }, [draftVehicleId, vehicleId, start]);

  const openSearch = useCallback(() => router.push('/service-picker'), [router]);
  const goBack = useCallback(() => {
    setErrors({});
    if (step > 1) setStep(step === 3 ? 2 : 1);
  }, [step, setStep]);

  const consistencyErrors = useCallback((): DraftErrors => {
    const { vehicles, records } = useGarageStore.getState();
    const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
    const message = vehicle === undefined ? undefined : odometerConsistencyError(useLogWorkDraft.getState(), vehicle, records);
    return message === undefined ? {} : { odometer: message };
  }, [vehicleId]);

  const goNext = useCallback(() => {
    if (step === 3) return;
    const blocking = { ...stepErrors(useLogWorkDraft.getState(), step), ...(step === 2 ? consistencyErrors() : {}) };
    setErrors(blocking);
    if (Object.keys(blocking).length === 0) setStep(step === 1 ? 2 : 3);
  }, [step, setStep, consistencyErrors]);

  const save = useCallback(async () => {
    const result = buildRecordInput(useLogWorkDraft.getState());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      const record = recordId === null ? await createRecord(vehicleId, result.input) : await updateRecord(recordId, result.input);
      upsertRecord(record);
      reset();
      router.back();
    } catch (error) {
      if (error instanceof ApiError && error.failure.kind === 'http' && error.failure.code === 'ODOMETER_INCONSISTENT') {
        // Another device or a refresh changed the readings: show it where it can be fixed.
        setErrors({ odometer: error.failure.message });
        setStep(2);
        return;
      }
      // The draft stays as typed, so Retry resends exactly the same record.
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [vehicleId, recordId, upsertRecord, reset, router, setStep]);

  const handleSave = useCallback(() => {
    void save();
  }, [save]);

  // The form sheet stretches its ScrollView to the full sheet height, so the footer
  // sits on top of the last fields; reserve its height at the end of the content.
  const [footerHeight, setFooterHeight] = useState(0);
  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => setFooterHeight(event.nativeEvent.layout.height), []);
  const contentStyle = useMemo(() => [styles.content, { paddingBottom: CONTENT_BOTTOM_PADDING + footerHeight }], [footerHeight]);
  const indicatorInsets = useMemo(() => ({ bottom: footerHeight }), [footerHeight]);

  return (
    // The ScrollView must be the sheet's direct child: react-native-screens' form
    // sheet lays out a nested one with no height and the content disappears.
    <>
      <ScrollView
        style={styles.sheet}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={contentStyle}
        scrollIndicatorInsets={indicatorInsets}
      >
        <Text style={styles.stepLabel}>
          {`${recordId === null ? strings.logWork.title : strings.logWork.editTitle} · ${strings.logWork.stepOf(step)}`}
        </Text>
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
        {step === 1 ? <WhatStep error={errors.lineItems} onSearch={openSearch} /> : null}
        {step === 2 ? <WhenStep errors={errors} /> : null}
        {step === 3 ? <CostStep errors={errors} /> : null}
        {saveError === null ? null : <ErrorBanner testID="log-work-save-error" message={saveError} onRetry={handleSave} />}
      </ScrollView>
      <View style={styles.footer} onLayout={handleFooterLayout}>
        {step > 1 ? (
          <View style={styles.footerButton}>
            <Button testID="log-work-back" title={strings.logWork.back} variant="secondary" onPress={goBack} />
          </View>
        ) : null}
        <View style={styles.footerButton}>
          {step < 3 ? (
            <Button testID="log-work-next" title={strings.logWork.next} onPress={goNext} />
          ) : (
            <Button testID="log-work-save" title={strings.logWork.save} onPress={handleSave} loading={saving} />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  stepLabel: { fontSize: 13, color: colors.secondaryLabel, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: colors.label, paddingBottom: 4 },
  footer: { backgroundColor: colors.background, flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  footerButton: { flex: 1 },
});
