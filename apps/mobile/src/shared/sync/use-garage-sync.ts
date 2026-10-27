import { useEffect } from 'react';
import { fetchAllRecords } from '@/shared/api/records-api';
import { fetchVehicles } from '@/shared/api/vehicles-api';
import { useGarageStore } from '@/shared/store/garage-store';

function warnInDevelopment(error: unknown): void {
  // Offline is expected; in development surface why so it is not silent.
  if (__DEV__) console.warn('Garage sync failed:', error instanceof Error ? error.message : error);
}

/** Refreshes the mirror from the API on launch; when offline the persisted data stays as is. */
export function useGarageSync(): void {
  const replaceVehicles = useGarageStore((state) => state.replaceVehicles);
  const replaceRecords = useGarageStore((state) => state.replaceRecords);

  useEffect(() => {
    fetchVehicles().then((vehicles) => replaceVehicles(vehicles, Date.now()), warnInDevelopment);
    fetchAllRecords().then(replaceRecords, warnInDevelopment);
  }, [replaceVehicles, replaceRecords]);
}
