import { useEffect } from 'react';
import { fetchVehicles } from '@/shared/api/vehicles-api';
import { useGarageStore } from '@/shared/store/garage-store';

/** Refreshes the mirror from the API on launch; when offline the persisted data stays as is. */
export function useGarageSync(): void {
  const replaceVehicles = useGarageStore((state) => state.replaceVehicles);

  useEffect(() => {
    fetchVehicles().then(
      (vehicles) => replaceVehicles(vehicles, Date.now()),
      (error: unknown) => {
        // Offline is expected; in development surface why so it is not silent.
        if (__DEV__) console.warn('Garage sync failed:', error instanceof Error ? error.message : error);
      },
    );
  }, [replaceVehicles]);
}
