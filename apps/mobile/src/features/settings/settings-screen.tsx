import { ScrollView, StyleSheet } from 'react-native';
import { Card } from '@/components/card';
import { ApiHealthStatus } from './api-health-status';
import { colors } from '@/shared/ui/colors';

export function SettingsScreen() {
  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Card>
        <ApiHealthStatus />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16 },
});
