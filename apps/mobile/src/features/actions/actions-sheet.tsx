import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { useLogWorkDraft } from '@/features/log-work/log-work-draft';
import { selectSelectedVehicle, useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

/** The "+" menu (variant B): log work, add a vehicle, or transfer. */
export function ActionsSheet() {
  const router = useRouter();
  const vehicle = useGarageStore(selectSelectedVehicle);

  const logWork = useCallback(() => {
    if (vehicle === undefined) return;
    useLogWorkDraft.getState().start({ vehicleId: vehicle.id });
    router.replace({ pathname: '/log-work', params: { vehicleId: vehicle.id } });
  }, [router, vehicle]);
  const addVehicle = useCallback(() => router.replace('/add-vehicle'), [router]);
  const transfer = useCallback(() => router.replace('/settings'), [router]);

  return (
    <View testID="actions-sheet" style={styles.sheet}>
      <Text style={styles.title}>{strings.actions.title}</Text>
      <Button testID="action-log-work" title={strings.actions.logWork} onPress={logWork} disabled={vehicle === undefined} />
      {vehicle === undefined ? <Text style={styles.hint}>{strings.actions.needVehicle}</Text> : null}
      <Button testID="action-add-vehicle" title={strings.actions.addVehicle} variant="secondary" onPress={addVehicle} />
      <Button testID="action-transfer" title={strings.actions.transfer} variant="secondary" onPress={transfer} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 17, fontWeight: '600', color: colors.label, textAlign: 'center', paddingBottom: 4 },
  hint: { fontSize: 13, color: colors.secondaryLabel, textAlign: 'center' },
});
