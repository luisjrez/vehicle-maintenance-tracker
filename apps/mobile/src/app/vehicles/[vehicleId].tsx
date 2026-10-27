import { useLocalSearchParams } from 'expo-router';
import { VehicleDetailsScreen } from '@/features/vehicle-details/vehicle-details-screen';

export default function VehicleDetailsRoute() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  return <VehicleDetailsScreen vehicleId={vehicleId} />;
}
