import { useLogWorkDraft } from '@/shared/log-work-draft/log-work-draft';
import { useGarageStore } from '@/shared/store/garage-store';

export function resetGarageStore(): void {
  useGarageStore.setState({ vehicles: [], records: [], selectedVehicleId: null, vehiclesSyncedAt: null });
  useLogWorkDraft.getState().reset();
}
