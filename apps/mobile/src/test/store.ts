import { useGarageStore } from '@/shared/store/garage-store';

export function resetGarageStore(): void {
  useGarageStore.setState({ vehicles: [], selectedVehicleId: null, vehiclesSyncedAt: null });
}
