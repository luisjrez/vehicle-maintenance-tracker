import { compareRecordsNewestFirst, type ServiceRecord } from '@vmt/shared';
import { useMemo } from 'react';
import { sorted } from '@/shared/sorted';
import { useGarageStore } from './garage-store';

/** A vehicle's records, newest first. Filtering happens outside the selector so it stays referentially stable. */
export function useVehicleRecords(vehicleId: string | undefined): ServiceRecord[] {
  const records = useGarageStore((state) => state.records);
  return useMemo(
    () => sorted(records.filter((record) => record.vehicleId === vehicleId), compareRecordsNewestFirst),
    [records, vehicleId],
  );
}
