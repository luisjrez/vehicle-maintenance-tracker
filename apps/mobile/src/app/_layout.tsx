import { Stack } from 'expo-router';
import { useGarageSync } from '@/shared/sync/use-garage-sync';
import { strings } from '@/shared/strings';

export default function RootLayout() {
  useGarageSync();

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: strings.garage.title, headerLargeTitle: true, headerShadowVisible: false }} />
      <Stack.Screen name="add-vehicle" options={{ title: strings.addVehicle.title, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: strings.settings.title }} />
    </Stack>
  );
}
