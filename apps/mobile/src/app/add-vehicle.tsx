import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { HeaderButton } from '@/components/header-button';
import { AddVehicleScreen } from '@/features/add-vehicle/add-vehicle-screen';
import { strings } from '@/shared/strings';

export default function AddVehicleRoute() {
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);
  const headerLeft = useCallback(
    () => <HeaderButton testID="add-vehicle-cancel" title={strings.addVehicle.cancel} onPress={close} />,
    [close],
  );

  return (
    <>
      <Stack.Screen options={{ headerLeft }} />
      <AddVehicleScreen />
    </>
  );
}
