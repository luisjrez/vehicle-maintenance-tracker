import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { TextField } from '@/components/text-field';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import type { VinFeedback } from '@/shared/vin/vin-feedback';

type Props = {
  vin: string;
  feedback: VinFeedback;
  onChangeVin: (value: string) => void;
  onLookUp: () => void;
  onWithoutVin: () => void;
  lookingUp: boolean;
  lookupError: string | null;
};

export function VinStep({ vin, feedback, onChangeVin, onLookUp, onWithoutVin, lookingUp, lookupError }: Props) {
  const t = strings.addVehicle;
  return (
    <View testID="vin-step" style={styles.step}>
      <TextField
        testID="vin-input"
        label={t.vinLabel}
        value={vin}
        onChangeText={onChangeVin}
        placeholder={t.vinPlaceholder}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={24}
        error={feedback.state === 'invalid' ? feedback.message : undefined}
      />
      {feedback.state === 'typing' ? <Text style={styles.hint}>{feedback.message}</Text> : null}
      {feedback.state === 'valid' ? (
        <Text testID="vin-valid" style={styles.valid}>
          {`✓ ${t.vinValid}`}
        </Text>
      ) : null}
      {feedback.state === 'empty' ? <Text style={styles.hint}>{t.vinHint}</Text> : null}
      {lookupError === null ? null : <ErrorBanner testID="vin-lookup-error" message={lookupError} onRetry={onLookUp} />}
      <Button
        testID="vin-look-up"
        title={t.lookUp}
        onPress={onLookUp}
        disabled={feedback.state !== 'valid'}
        loading={lookingUp}
      />
      <Button testID="vin-skip" title={t.withoutVin} variant="secondary" onPress={onWithoutVin} />
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 12 },
  hint: { fontSize: 13, color: colors.secondaryLabel },
  valid: { fontSize: 13, color: colors.tint, fontWeight: '600' },
});
