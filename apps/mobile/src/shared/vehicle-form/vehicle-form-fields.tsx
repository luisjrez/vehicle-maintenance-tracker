import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '@/components/section-header';
import { TextField } from '@/components/text-field';
import { strings } from '@/shared/strings';
import type { FieldErrors, FieldSetters } from './use-vehicle-form';
import type { VehicleFormValues } from './vehicle-form-values';

type Props = { values: VehicleFormValues; setters: FieldSetters; errors: FieldErrors };

const labels = {
  bodyClass: 'Body class',
  vehicleType: 'Vehicle type',
  fuelType: 'Fuel type',
  electrification: 'Electrification',
  cylinders: 'Cylinders',
  displacementL: 'Displacement (L)',
  driveType: 'Drive type',
} as const;

/** Every editable vehicle field (ADR-0003: decoded details stay editable). */
export function VehicleFormFields({ values, setters, errors }: Props) {
  const t = strings.addVehicle;
  return (
    <View style={styles.form}>
      <SectionHeader title={t.detailsSection} />
      <TextField testID="vehicle-year" label={t.year} required value={values.year} onChangeText={setters.year} keyboardType="number-pad" maxLength={4} error={errors.year} />
      <TextField testID="vehicle-make" label={t.make} required value={values.make} onChangeText={setters.make} autoCapitalize="words" error={errors.make} />
      <TextField testID="vehicle-model" label={t.model} required value={values.model} onChangeText={setters.model} autoCapitalize="words" error={errors.model} />
      <TextField testID="vehicle-trim" label={t.trim} value={values.trim} onChangeText={setters.trim} error={errors.trim} />
      <TextField testID="vehicle-body-class" label={labels.bodyClass} value={values.bodyClass} onChangeText={setters.bodyClass} error={errors.bodyClass} />
      <TextField testID="vehicle-vehicle-type" label={labels.vehicleType} value={values.vehicleType} onChangeText={setters.vehicleType} error={errors.vehicleType} />
      <TextField testID="vehicle-fuel-type" label={labels.fuelType} value={values.fuelType} onChangeText={setters.fuelType} error={errors.fuelType} />
      <TextField testID="vehicle-electrification" label={labels.electrification} value={values.electrification} onChangeText={setters.electrification} error={errors.electrification} />
      <TextField testID="vehicle-cylinders" label={labels.cylinders} value={values.cylinders} onChangeText={setters.cylinders} keyboardType="number-pad" maxLength={2} error={errors.cylinders} />
      <TextField testID="vehicle-displacement" label={labels.displacementL} value={values.displacementL} onChangeText={setters.displacementL} keyboardType="decimal-pad" maxLength={4} error={errors.displacementL} />
      <TextField testID="vehicle-drive-type" label={labels.driveType} value={values.driveType} onChangeText={setters.driveType} error={errors.driveType} />

      <SectionHeader title={t.odometerSection} />
      <TextField testID="vehicle-initial-odometer" label={t.initialOdometer} required value={values.initialOdometer} onChangeText={setters.initialOdometer} keyboardType="number-pad" maxLength={9} error={errors.initialOdometer} />

      <SectionHeader title={t.personalSection} />
      <TextField testID="vehicle-nickname" label={t.nickname} value={values.nickname} onChangeText={setters.nickname} error={errors.nickname} />
      <TextField testID="vehicle-plate" label={t.plate} value={values.plate} onChangeText={setters.plate} autoCapitalize="characters" autoCorrect={false} maxLength={10} error={errors.plate} />
      <TextField testID="vehicle-plate-state" label={t.plateState} value={values.plateState} onChangeText={setters.plateState} autoCapitalize="characters" autoCorrect={false} maxLength={2} placeholder="CA" error={errors.plateState} />
      <TextField testID="vehicle-color" label={t.color} value={values.color} onChangeText={setters.color} error={errors.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
});
