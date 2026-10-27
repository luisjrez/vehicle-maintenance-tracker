import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '@/components/section-header';
import { TextField } from '@/components/text-field';
import { strings } from '@/shared/strings';
import type { FieldErrors, FieldSetters } from './use-vehicle-form';
import type { VehicleFormValues } from './vehicle-form-values';

type Props = {
  values: VehicleFormValues;
  setters: FieldSetters;
  errors: FieldErrors;
  /** Opens the scanner in odometer mode for the initial odometer. */
  onScanOdometer?: () => void;
  odometerHint?: string | undefined;
};

/** Every editable vehicle field (ADR-0003: decoded details stay editable). */
export function VehicleFormFields({ values, setters, errors, onScanOdometer, odometerHint }: Props) {
  const copy = strings.addVehicle;
  return (
    <View style={styles.form}>
      <SectionHeader title={copy.detailsSection} />
      <TextField testID="vehicle-year" label={copy.year} required value={values.year} onChangeText={setters.year} keyboardType="number-pad" maxLength={4} error={errors.year} />
      <TextField testID="vehicle-make" label={copy.make} required value={values.make} onChangeText={setters.make} autoCapitalize="words" error={errors.make} />
      <TextField testID="vehicle-model" label={copy.model} required value={values.model} onChangeText={setters.model} autoCapitalize="words" error={errors.model} />
      <TextField testID="vehicle-trim" label={copy.trim} value={values.trim} onChangeText={setters.trim} error={errors.trim} />
      <TextField testID="vehicle-body-class" label={copy.bodyClass} value={values.bodyClass} onChangeText={setters.bodyClass} error={errors.bodyClass} />
      <TextField testID="vehicle-vehicle-type" label={copy.vehicleType} value={values.vehicleType} onChangeText={setters.vehicleType} error={errors.vehicleType} />
      <TextField testID="vehicle-fuel-type" label={copy.fuelType} value={values.fuelType} onChangeText={setters.fuelType} error={errors.fuelType} />
      <TextField testID="vehicle-electrification" label={copy.electrification} value={values.electrification} onChangeText={setters.electrification} error={errors.electrification} />
      <TextField testID="vehicle-cylinders" label={copy.cylinders} value={values.cylinders} onChangeText={setters.cylinders} keyboardType="number-pad" maxLength={2} error={errors.cylinders} />
      <TextField testID="vehicle-displacement" label={copy.displacementL} value={values.displacementL} onChangeText={setters.displacementL} keyboardType="decimal-pad" maxLength={4} error={errors.displacementL} />
      <TextField testID="vehicle-drive-type" label={copy.driveType} value={values.driveType} onChangeText={setters.driveType} error={errors.driveType} />

      <SectionHeader title={copy.odometerSection} />
      <TextField testID="vehicle-initial-odometer" label={copy.initialOdometer} required value={values.initialOdometer} onChangeText={setters.initialOdometer} keyboardType="number-pad" maxLength={9} error={errors.initialOdometer} hint={odometerHint} action={onScanOdometer === undefined ? undefined : { title: strings.scan.action, onPress: onScanOdometer, testID: 'vehicle-initial-odometer-scan' }} />

      <SectionHeader title={copy.personalSection} />
      <TextField testID="vehicle-nickname" label={copy.nickname} value={values.nickname} onChangeText={setters.nickname} error={errors.nickname} />
      <TextField testID="vehicle-plate" label={copy.plate} value={values.plate} onChangeText={setters.plate} autoCapitalize="characters" autoCorrect={false} maxLength={10} error={errors.plate} />
      <TextField testID="vehicle-plate-state" label={copy.plateState} value={values.plateState} onChangeText={setters.plateState} autoCapitalize="characters" autoCorrect={false} maxLength={2} placeholder="CA" error={errors.plateState} />
      <TextField testID="vehicle-color" label={copy.color} value={values.color} onChangeText={setters.color} error={errors.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
});
