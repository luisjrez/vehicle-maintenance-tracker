import { render, screen } from '@testing-library/react-native';
import { GarageScreen } from './garage-screen';
import { useGarageStore } from '@/shared/store/garage-store';
import { mmkvStorage } from '@/shared/store/mmkv-storage';
import { recordFixture, vehicleFixture } from '@/test/fixtures';
import { resetGarageStore } from '@/test/store';
import { syncGarage } from '@/shared/sync/use-garage-sync';

describe('offline browsing', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
  });

  it('shows the last synced garage on a cold start with no connectivity', async () => {
    const vehicle = vehicleFixture({ id: 'vehicle-1', nickname: 'Daily' });
    const record = recordFixture({ vehicleId: 'vehicle-1', odometer: 51_000 });
    useGarageStore.setState({ vehicles: [vehicle], records: [record], selectedVehicleId: 'vehicle-1', vehiclesSyncedAt: 1 });
    const persisted = await mmkvStorage.getItem('garage');
    // A fresh launch: memory is empty, only what MMKV kept survives.
    resetGarageStore();
    if (typeof persisted === 'string') await mmkvStorage.setItem('garage', persisted);
    await useGarageStore.persist.rehydrate();

    await expect(syncGarage()).rejects.toThrow('offline');
    await render(<GarageScreen />);

    expect(screen.getByTestId('vehicle-summary-name')).toHaveTextContent('2019 Honda Civic');
    expect(screen.getByTestId('vehicle-summary-mileage')).toHaveTextContent('51,000 mi');
    expect(screen.getByTestId(`history-row-${record.id}`)).toBeTruthy();
  });
});
