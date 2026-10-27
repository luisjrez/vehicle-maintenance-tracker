import { DomainError } from './domain-error.js';

// Another Owner's ids answer exactly like missing ones, so ids cannot be probed.
export const vehicleNotFound = () =>
  new DomainError(404, 'VEHICLE_NOT_FOUND', 'This vehicle no longer exists. Pull to refresh your garage.');

export const recordNotFound = () => new DomainError(404, 'RECORD_NOT_FOUND', 'This record no longer exists.');
