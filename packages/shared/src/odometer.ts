/** Current mileage is derived, never stored: the highest of all readings (ADR-0007). */
export function currentMileage(
  vehicle: { initialOdometer: number },
  records: ReadonlyArray<{ odometer: number | null }>,
): number {
  return records.reduce(
    (highest, record) => (record.odometer !== null && record.odometer > highest ? record.odometer : highest),
    vehicle.initialOdometer,
  );
}
