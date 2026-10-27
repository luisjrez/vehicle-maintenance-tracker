import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { HeaderButton } from '@/components/header-button';
import { GarageScreen } from '@/features/garage/garage-screen';
import { strings } from '@/shared/strings';

export default function HomeRoute() {
  const router = useRouter();
  const openSettings = useCallback(() => router.push('/settings'), [router]);
  const headerRight = useCallback(
    () => <HeaderButton testID="open-settings" title={strings.garage.settings} onPress={openSettings} />,
    [openSettings],
  );

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
      <GarageScreen />
    </>
  );
}
