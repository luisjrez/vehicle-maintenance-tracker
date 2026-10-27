import type { OwnerSummary, ServiceRecord, Vehicle } from '@vmt/shared';

/** Vehicle data refreshes from the API at most once a day (ADR-0003, ADR-0008). */
export const VEHICLE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type GarageFetchers = {
  fetchOwner: () => Promise<OwnerSummary>;
  fetchVehicles: () => Promise<Vehicle[]>;
  fetchRecords: () => Promise<ServiceRecord[]>;
};

export type GarageMirror = {
  vehicleCount: number;
  vehiclesSyncedAt: number | null;
  replaceVehicles: (vehicles: Vehicle[], syncedAt: number) => void;
  replaceRecords: (records: ServiceRecord[]) => void;
};

export function vehiclesAreStale(syncedAt: number | null, now: number): boolean {
  return syncedAt === null || now - syncedAt >= VEHICLE_REFRESH_INTERVAL_MS;
}

/**
 * One refresh pass, run on launch and whenever the app comes to the foreground.
 * Records always refresh. Vehicles refresh when a day has passed, or sooner when
 * the server's vehicle count disagrees with the mirror (another write, or this
 * phone lost its data to a transfer). Offline, the mirror stays untouched.
 */
export async function refreshGarage(fetchers: GarageFetchers, mirror: GarageMirror, now: number): Promise<void> {
  const [owner, records] = await Promise.all([fetchers.fetchOwner(), fetchers.fetchRecords()]);
  if (vehiclesAreStale(mirror.vehiclesSyncedAt, now) || owner.vehicleCount !== mirror.vehicleCount) {
    mirror.replaceVehicles(await fetchers.fetchVehicles(), now);
  }
  mirror.replaceRecords(records);
}
