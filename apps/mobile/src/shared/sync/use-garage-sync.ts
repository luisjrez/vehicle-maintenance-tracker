import { useEffect } from 'react';
import { AppState } from 'react-native';
import { fetchOwner } from '@/shared/api/owner-api';
import { fetchAllRecords } from '@/shared/api/records-api';
import { fetchVehicles } from '@/shared/api/vehicles-api';
import { useGarageStore } from '@/shared/store/garage-store';
import { refreshGarage } from './refresh-garage';

const fetchers = { fetchOwner, fetchVehicles, fetchRecords: fetchAllRecords };

function warnInDevelopment(error: unknown): void {
  // Offline is expected; in development surface why so it is not silent.
  if (__DEV__) console.warn('Garage sync failed:', error instanceof Error ? error.message : error);
}

/** Exported for the transfer flow, which must reload everything right after a redeem. */
export function syncGarage(): Promise<void> {
  const state = useGarageStore.getState();
  return refreshGarage(
    fetchers,
    {
      vehicleCount: state.vehicles.length,
      vehiclesSyncedAt: state.vehiclesSyncedAt,
      replaceVehicles: state.replaceVehicles,
      replaceRecords: state.replaceRecords,
    },
    Date.now(),
  );
}

/** Refreshes the mirror on launch and on every return to the foreground (ADR-0008). */
export function useGarageSync(): void {
  useEffect(() => {
    syncGarage().catch(warnInDevelopment);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') syncGarage().catch(warnInDevelopment);
    });
    return () => subscription.remove();
  }, []);
}
