import { createVehicleSchema, todayIsoDate } from '@vmt/shared';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ErrorBanner } from '@/components/error-banner';
import { errorMessage } from '@/shared/api/api-error';
import { createVehicle } from '@/shared/api/vehicles-api';
import { decodeVin } from '@/shared/api/vin-api';
import { fieldErrors } from '@/shared/forms/field-errors';
import { useScanner } from '@/shared/scanner/use-scanner';
import { useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { useVehicleForm } from '@/shared/vehicle-form/use-vehicle-form';
import { VehicleFormFields } from '@/shared/vehicle-form/vehicle-form-fields';
import { decodedToFormValues, emptyVehicleForm, formValuesToInput } from '@/shared/vehicle-form/vehicle-form-values';
import { vinFeedback } from '@/shared/vin/vin-feedback';
import { VinStep } from './vin-step';

type Step = { name: 'vin' } | { name: 'details'; vin: string | null; notice: string | null };

/** Add vehicle: VIN (typed or scanned) → decoded review, or straight to the manual form (ADR-0003). */
export function AddVehicleScreen() {
  const router = useRouter();
  const upsertVehicle = useGarageStore((state) => state.upsertVehicle);
  const selectVehicle = useGarageStore((state) => state.selectVehicle);
  const { values, setters, errors, setErrors, replaceValues } = useVehicleForm(emptyVehicleForm);
  const [step, setStep] = useState<Step>({ name: 'vin' });
  const [vinInput, setVinInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const feedback = useMemo(() => vinFeedback(vinInput), [vinInput]);
  const [scanned, setScanned] = useState<{ vin: boolean; odometer: boolean }>({ vin: false, odometer: false });

  // A scanned value only fills the editable field; the Owner still reviews and saves (ADR-0006).
  const fillScannedVin = useCallback((value: string) => {
    setVinInput(value);
    setScanned((current) => ({ ...current, vin: true }));
  }, []);
  const setInitialOdometer = setters.initialOdometer;
  const fillScannedOdometer = useCallback(
    (value: string) => {
      setInitialOdometer(value);
      setScanned((current) => ({ ...current, odometer: true }));
    },
    [setInitialOdometer],
  );
  const scanVin = useScanner('vin', fillScannedVin);
  const scanOdometer = useScanner('odometer', fillScannedOdometer);
  const openVinScanner = useCallback(() => scanVin(), [scanVin]);
  const openOdometerScanner = useCallback(() => scanOdometer(), [scanOdometer]);

  const lookUp = useCallback(async () => {
    if (feedback.state !== 'valid') return;
    setLookupError(null);
    setLookingUp(true);
    try {
      const result = await decodeVin(feedback.vin);
      const t = strings.addVehicle;
      const notice = { decoded: t.decodedNotice, no_data: t.noDataNotice, unavailable: t.unavailableNotice }[result.status];
      replaceValues(decodedToFormValues(result.details, result.modelYearCandidates));
      setStep({ name: 'details', vin: result.vin, notice });
    } catch (error) {
      setLookupError(errorMessage(error));
    } finally {
      setLookingUp(false);
    }
  }, [feedback, replaceValues]);

  const handleLookUp = useCallback(() => {
    void lookUp();
  }, [lookUp]);

  const skipVin = useCallback(() => setStep({ name: 'details', vin: null, notice: null }), []);
  const backToVin = useCallback(() => setStep({ name: 'vin' }), []);

  const save = useCallback(async () => {
    if (step.name !== 'details') return;
    const parsed = createVehicleSchema.safeParse({
      ...formValuesToInput(values),
      vin: step.vin ?? undefined,
      initialOdometerDate: todayIsoDate(),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      // The store only changes from the API response (ADR-0008); on failure the form keeps its input.
      const vehicle = await createVehicle(parsed.data);
      upsertVehicle(vehicle);
      selectVehicle(vehicle.id);
      router.back();
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [step, values, setErrors, upsertVehicle, selectVehicle, router]);

  const handleSave = useCallback(() => {
    void save();
  }, [save]);

  return (
    <ScrollView
      testID="add-vehicle-screen"
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}
    >
      {step.name === 'vin' ? (
        <VinStep
          vin={vinInput}
          feedback={feedback}
          onChangeVin={setVinInput}
          onScan={openVinScanner}
          scanned={scanned.vin}
          onLookUp={handleLookUp}
          onWithoutVin={skipVin}
          lookingUp={lookingUp}
          lookupError={lookupError}
        />
      ) : (
        <>
          {step.vin === null ? null : (
            <Card testID="add-vehicle-vin-card">
              <Text style={styles.caption}>{strings.addVehicle.vinLabel}</Text>
              <Text selectable style={styles.vin}>
                {step.vin}
              </Text>
              {step.notice === null ? null : (
                <Text testID="add-vehicle-notice" style={styles.caption}>
                  {step.notice}
                </Text>
              )}
              <Button testID="add-vehicle-change-vin" title={strings.addVehicle.changeVin} variant="secondary" onPress={backToVin} />
            </Card>
          )}
          <VehicleFormFields
            values={values}
            setters={setters}
            errors={errors}
            onScanOdometer={openOdometerScanner}
            odometerHint={scanned.odometer ? strings.scan.checkIt : undefined}
          />
          <View style={styles.footer}>
            {saveError === null ? null : <ErrorBanner message={saveError} onRetry={handleSave} />}
            {errors.vin === undefined ? null : <ErrorBanner testID="add-vehicle-vin-error" message={errors.vin} />}
            <Button testID="add-vehicle-save" title={strings.addVehicle.save} loading={saving} onPress={handleSave} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  footer: { gap: 12 },
  caption: { fontSize: 13, color: colors.secondaryLabel },
  vin: { fontSize: 20, fontWeight: '600', letterSpacing: 1, color: colors.label, fontVariant: ['tabular-nums'] },
});
