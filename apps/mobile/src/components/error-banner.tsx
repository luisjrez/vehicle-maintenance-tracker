import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/ui/colors';
import { Button } from './button';

type Props = { message: string; onRetry?: () => void; retryLabel?: string; testID?: string };

/** Inline failure message; with `onRetry` it doubles as the retry affordance for failed writes. */
export function ErrorBanner({ message, onRetry, retryLabel = 'Retry', testID = 'error-banner' }: Props) {
  return (
    <View testID={testID} style={styles.banner} accessibilityRole="alert">
      <Text selectable style={styles.message}>
        {message}
      </Text>
      {onRetry === undefined ? null : (
        <Button testID={`${testID}-retry`} title={retryLabel} variant="secondary" onPress={onRetry} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { gap: 8, padding: 12, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.destructive },
  message: { color: colors.destructive, fontSize: 15 },
});
