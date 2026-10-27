import { type NativeStackNavigationOptions, Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useColorScheme } from 'react-native';
import { useGarageSync } from '@/shared/sync/use-garage-sync';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

// The expanded large title sits on the screen's own background, so it never reads as
// a separate band; collapsed, the bar gets the system blur.
const GARAGE_OPTIONS: NativeStackNavigationOptions = {
  title: strings.garage.title,
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerLargeStyle: { backgroundColor: colors.background },
  headerBlurEffect: 'systemMaterial',
};

// Native sheets and modals throughout (flows decision): menus and the wizard are
// form sheets, adding a vehicle is a modal.
export default function RootLayout() {
  useGarageSync();
  // Without a theme, navigation chrome stays light: in dark mode the garage header
  // showed a light bar over black content.
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={GARAGE_OPTIONS} />
        <Stack.Screen name="add-vehicle" options={{ title: strings.addVehicle.title, presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: strings.settings.title }} />
        <Stack.Screen name="vehicles/[vehicleId]" options={{ title: strings.vehicleDetails.title }} />
        <Stack.Screen
          name="actions"
          options={{ presentation: 'formSheet', headerShown: false, sheetAllowedDetents: [0.38], sheetGrabberVisible: true }}
        />
        <Stack.Screen
          name="log-work"
          options={{ presentation: 'formSheet', headerShown: false, sheetAllowedDetents: [0.92], sheetGrabberVisible: true }}
        />
        <Stack.Screen
          name="service-picker"
          options={{ presentation: 'formSheet', title: strings.servicePicker.title, sheetAllowedDetents: [0.92], sheetGrabberVisible: true }}
        />
        <Stack.Screen
          name="transfer"
          options={{ presentation: 'formSheet', headerShown: false, sheetAllowedDetents: [0.92], sheetGrabberVisible: true }}
        />
        <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="records/[recordId]"
          options={{ presentation: 'formSheet', headerShown: false, sheetAllowedDetents: [0.6, 0.92], sheetGrabberVisible: true }}
        />
      </Stack>
    </ThemeProvider>
  );
}
