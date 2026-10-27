import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ApiHealthStatus } from '@/features/health/api-health-status';
import { strings } from '@/shared/strings';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: strings.appName }} />
      <ApiHealthStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
