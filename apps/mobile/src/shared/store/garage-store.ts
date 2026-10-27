import type { ServiceRecord, Vehicle } from '@vmt/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';

/**
 * Local mirror of the Owner's data (ADR-0008). Reads come from here so the
 * garage works offline; it only changes from API responses.
 */
export type GarageState = {
  vehicles: Vehicle[];
  records: ServiceRecord[];
  selectedVehicleId: string | null;
  /** Epoch ms of the last successful vehicle list fetch. */
  vehiclesSyncedAt: number | null;
  replaceVehicles: (vehicles: Vehicle[], syncedAt: number) => void;
  replaceRecords: (records: ServiceRecord[]) => void;
  upsertVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  upsertRecord: (record: ServiceRecord) => void;
  removeRecord: (recordId: string) => void;
  selectVehicle: (vehicleId: string) => void;
};

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [...items, item];
}

export const useGarageStore = create<GarageState>()(
  persist(
    (set) => ({
      vehicles: [],
      records: [],
      selectedVehicleId: null,
      vehiclesSyncedAt: null,
      replaceVehicles: (vehicles, syncedAt) => set({ vehicles, vehiclesSyncedAt: syncedAt }),
      replaceRecords: (records) => set({ records }),
      upsertVehicle: (vehicle) => set((state) => ({ vehicles: upsert(state.vehicles, vehicle) })),
      removeVehicle: (vehicleId) =>
        set((state) => ({
          vehicles: state.vehicles.filter((vehicle) => vehicle.id !== vehicleId),
          records: state.records.filter((record) => record.vehicleId !== vehicleId),
        })),
      upsertRecord: (record) => set((state) => ({ records: upsert(state.records, record) })),
      removeRecord: (recordId) => set((state) => ({ records: state.records.filter((record) => record.id !== recordId) })),
      selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId }),
    }),
    { name: 'garage', version: 1, storage: createJSONStorage(() => mmkvStorage) },
  ),
);

/** The selected vehicle, falling back to the first one when the selection is gone. */
export function selectSelectedVehicle(state: GarageState): Vehicle | undefined {
  return state.vehicles.find((vehicle) => vehicle.id === state.selectedVehicleId) ?? state.vehicles[0];
}
