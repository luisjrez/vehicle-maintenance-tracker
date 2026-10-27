import { updateVehicleSchema, type Vehicle, vehicleDisplayName } from '@vmt/shared';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { TextField } from '@/components/text-field';
import { errorMessage } from '@/shared/api/api-error';
import { deleteVehicle, updateVehicle } from '@/shared/api/vehicles-api';
import { fieldErrors } from '@/shared/forms/field-errors';
import { useGarageStore } from '@/shared/store/garage-store';
import { useVehicleRecords } from '@/shared/store/use-vehicle-records';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { useVehicleForm } from '@/shared/vehicle-form/use-vehicle-form';
import { VehicleFormFields } from '@/shared/vehicle-form/vehicle-form-fields';
import { formValuesToUpdate, vehicleToFormValues } from '@/shared/vehicle-form/vehicle-form-values';
import { vinFeedback } from '@/shared/vin/vin-feedback';

export function VehicleDetailsScreen({ vehicleId }: { vehicleId: string }) {
  const vehicle = useGarageStore((state) => state.vehicles.find((candidate) => candidate.id === vehicleId));
  if (vehicle === undefined) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>{strings.vehicleDetails.missing}</Text>
      </View>
    );
  }
  return <VehicleDetailsForm vehicle={vehicle} />;
}

function VehicleDetailsForm({ vehicle }: { vehicle: Vehicle }) {
  const t = strings.vehicleDetails;
  const router = useRouter();
  const upsertVehicle = useGarageStore((state) => state.upsertVehicle);
  const removeVehicle = useGarageStore((state) => state.removeVehicle);
  const recordCount = useVehicleRecords(vehicle.id).length;
  const { values, setters, errors, setErrors } = useVehicleForm(vehicleToFormValues(vehicle));
  const [vinInput, setVinInput] = useState(vehicle.vin ?? '');
  const feedback = useMemo(() => vinFeedback(vinInput), [vinInput]);
  const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null);
  const [failure, setFailure] = useState<{ action: 'save' | 'delete'; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    if (feedback.state === 'invalid' || feedback.state === 'typing') {
      setErrors({ vin: feedback.message });
      return;
    }
    const parsed = updateVehicleSchema.safeParse(formValuesToUpdate(values, feedback.state === 'valid' ? feedback.vin : null));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFailure(null);
    setSaved(false);
    setBusy('saving');
    try {
      upsertVehicle(await updateVehicle(vehicle.id, parsed.data));
      setSaved(true);
    } catch (error) {
      setFailure({ action: 'save', message: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }, [feedback, values, setErrors, upsertVehicle, vehicle.id]);

  const performDelete = useCallback(async () => {
    setFailure(null);
    setBusy('deleting');
    try {
      await deleteVehicle(vehicle.id);
      removeVehicle(vehicle.id);
      router.back();
    } catch (error) {
      setFailure({ action: 'delete', message: errorMessage(error) });
      setBusy(null);
    }
  }, [vehicle.id, removeVehicle, router]);

  const handleSave = useCallback(() => {
    void save();
  }, [save]);

  const handleConfirmedDelete = useCallback(() => {
    void performDelete();
  }, [performDelete]);

  const confirmDelete = useCallback(() => {
    // A native alert, stating how much history is lost (flows decision: destructive confirmations).
    Alert.alert(t.confirmTitle(vehicleDisplayName(vehicle)), t.confirmBody(recordCount), [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: handleConfirmedDelete },
    ]);
  }, [t, vehicle, recordCount, handleConfirmedDelete]);

  const retry = failure?.action === 'delete' ? handleConfirmedDelete : handleSave;

  return (
    <ScrollView
      testID="vehicle-details-screen"
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.content}
    >
      <TextField
        testID="vehicle-vin"
        label={strings.addVehicle.vinLabel}
        value={vinInput}
        onChangeText={setVinInput}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={24}
        placeholder={t.vinHint}
        error={errors.vin ?? (feedback.state === 'invalid' ? feedback.message : undefined)}
      />
      <VehicleFormFields values={values} setters={setters} errors={errors} />
      {failure === null ? null : <ErrorBanner testID="vehicle-details-error" message={failure.message} onRetry={retry} />}
      {saved ? (
        <Text testID="vehicle-details-saved" style={styles.saved}>
          {t.saved}
        </Text>
      ) : null}
      <Button testID="vehicle-details-save" title={t.save} onPress={handleSave} loading={busy === 'saving'} disabled={busy !== null} />
      <Button
        testID="vehicle-details-delete"
        title={t.delete}
        variant="destructive"
        onPress={confirmDelete}
        loading={busy === 'deleting'}
        disabled={busy !== null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  missing: { padding: 24, color: colors.secondaryLabel, fontSize: 15 },
  saved: { color: colors.tint, fontSize: 15, textAlign: 'center' },
});
