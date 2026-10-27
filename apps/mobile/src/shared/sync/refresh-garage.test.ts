import { recordFixture, vehicleFixture } from '@/test/fixtures';
import { type GarageFetchers, type GarageMirror, refreshGarage, VEHICLE_REFRESH_INTERVAL_MS } from './refresh-garage';

const now = Date.parse('2026-10-26T12:00:00Z');

function fetchers(vehicleCount: number): GarageFetchers & { [K in keyof GarageFetchers]: jest.Mock } {
  return {
    fetchOwner: jest.fn(() => Promise.resolve({ createdAt: '2026-01-01T00:00:00.000Z', vehicleCount })),
    fetchVehicles: jest.fn(() => Promise.resolve([vehicleFixture()])),
    fetchRecords: jest.fn(() => Promise.resolve([recordFixture()])),
  };
}

function mirror({ vehicleCount = 1, vehiclesSyncedAt = now - 1000 }: Partial<Pick<GarageMirror, 'vehicleCount' | 'vehiclesSyncedAt'>> = {}) {
  return { vehicleCount, vehiclesSyncedAt, replaceVehicles: jest.fn(), replaceRecords: jest.fn() };
}

describe('refreshGarage', () => {
  it('refreshes records every time but vehicles only once a day', async () => {
    const api = fetchers(1);
    const fresh = mirror();

    await refreshGarage(api, fresh, now);

    expect(fresh.replaceRecords).toHaveBeenCalled();
    expect(api.fetchVehicles).not.toHaveBeenCalled();
  });

  it('refreshes vehicles once the last sync is a day old', async () => {
    const api = fetchers(1);
    const stale = mirror({ vehiclesSyncedAt: now - VEHICLE_REFRESH_INTERVAL_MS });

    await refreshGarage(api, stale, now);

    expect(stale.replaceVehicles).toHaveBeenCalledWith(expect.any(Array), now);
  });

  it('refreshes vehicles early when the server count differs, e.g. after a transfer emptied this phone', async () => {
    const api = fetchers(0);
    const local = mirror({ vehicleCount: 2 });

    await refreshGarage(api, local, now);

    expect(local.replaceVehicles).toHaveBeenCalled();
  });

  it('leaves the mirror untouched when offline', async () => {
    const api = fetchers(1);
    api.fetchRecords.mockRejectedValue(new TypeError('Network request failed'));
    const local = mirror({ vehiclesSyncedAt: null });

    await expect(refreshGarage(api, local, now)).rejects.toThrow('Network request failed');

    expect(local.replaceRecords).not.toHaveBeenCalled();
    expect(local.replaceVehicles).not.toHaveBeenCalled();
  });
});
