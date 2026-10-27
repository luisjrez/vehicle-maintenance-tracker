import type { Vehicle } from '@vmt/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';

/**
 * Local mirror of the Owner's data (ADR-0008). Reads come from here so the
 * garage works offline; it only changes from API responses.
 */
export type GarageState = {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  /** Epoch ms of the last successful vehicle list fetch. */
  vehiclesSyncedAt: number | null;
  replaceVehicles: (vehicles: Vehicle[], syncedAt: number) => void;
  upsertVehicle: (vehicle: Vehicle) => void;
  selectVehicle: (vehicleId: string) => void;
};

export const useGarageStore = create<GarageState>()(
  persist(
    (set) => ({
      vehicles: [],
      selectedVehicleId: null,
      vehiclesSyncedAt: null,
      replaceVehicles: (vehicles, syncedAt) => set({ vehicles, vehiclesSyncedAt: syncedAt }),
      upsertVehicle: (vehicle) =>
        set((state) => ({
          vehicles: state.vehicles.some((existing) => existing.id === vehicle.id)
            ? state.vehicles.map((existing) => (existing.id === vehicle.id ? vehicle : existing))
            : [...state.vehicles, vehicle],
        })),
      selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId }),
    }),
    { name: 'garage', version: 1, storage: createJSONStorage(() => mmkvStorage) },
  ),
);

/** The selected vehicle, falling back to the first one when the selection is gone. */
export function selectSelectedVehicle(state: GarageState): Vehicle | undefined {
  return state.vehicles.find((vehicle) => vehicle.id === state.selectedVehicleId) ?? state.vehicles[0];
}
