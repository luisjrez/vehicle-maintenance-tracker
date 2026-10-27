import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

type Props = { onAddVehicle: () => void; onReceive: () => void };

export function GarageEmptyState({ onAddVehicle, onReceive }: Props) {
  return (
    <View testID="garage-empty" style={styles.container}>
      <Text style={styles.title}>{strings.garage.emptyTitle}</Text>
      <Text style={styles.body}>{strings.garage.emptyBody}</Text>
      <View style={styles.actions}>
        <Button testID="garage-empty-add" title={strings.garage.addFirstVehicle} onPress={onAddVehicle} />
        <Button
          testID="garage-empty-receive"
          title={strings.garage.haveDataElsewhere}
          variant="secondary"
          onPress={onReceive}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingHorizontal: 24, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', color: colors.label, textAlign: 'center' },
  body: { fontSize: 15, color: colors.secondaryLabel, textAlign: 'center' },
  actions: { gap: 10, paddingTop: 12 },
});
