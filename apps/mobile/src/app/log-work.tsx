import { useLocalSearchParams } from 'expo-router';
import { LogWorkScreen } from '@/features/log-work/log-work-screen';

export default function LogWorkRoute() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  return <LogWorkScreen vehicleId={vehicleId} />;
}
