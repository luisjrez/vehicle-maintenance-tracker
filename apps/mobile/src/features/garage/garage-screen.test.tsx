import { fireEvent, render, screen } from '@testing-library/react-native';
import { useGarageStore } from '@/shared/store/garage-store';
import { vehicleFixture } from '@/test/fixtures';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { resetGarageStore } from '@/test/store';
import { GarageScreen } from './garage-screen';

describe('GarageScreen', () => {
  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
  });

  it('shows the empty state with both ways to start', async () => {
    await render(<GarageScreen />);

    expect(screen.getByTestId('garage-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('garage-empty-add'));
    expect(routerMock.push).toHaveBeenCalledWith('/add-vehicle');
    expect(screen.getByTestId('garage-empty-receive')).toBeTruthy();
  });

  it('shows every vehicle in the carousel and the selected one in the summary', async () => {
    const civic = vehicleFixture({ nickname: 'Daily' });
    const rav4 = vehicleFixture({ make: 'Toyota', model: 'RAV4', year: 2022, initialOdometer: 22_500, plate: null });
    useGarageStore.setState({ vehicles: [civic, rav4], selectedVehicleId: civic.id });

    await render(<GarageScreen />);

    expect(screen.getByTestId(`vehicle-tile-${civic.id}`)).toBeTruthy();
    expect(screen.getByTestId(`vehicle-tile-${rav4.id}`)).toBeTruthy();
    expect(screen.getByTestId('vehicle-tile-add')).toBeTruthy();
    expect(screen.getByTestId('vehicle-summary-name')).toHaveTextContent('2019 Honda Civic');
    expect(screen.getByTestId('vehicle-summary-mileage')).toHaveTextContent('47,750 mi');

    await fireEvent.press(screen.getByTestId(`vehicle-tile-${rav4.id}`));

    expect(screen.getByTestId('vehicle-summary-name')).toHaveTextContent('2022 Toyota RAV4');
    expect(screen.getByTestId('vehicle-summary-mileage')).toHaveTextContent('22,500 mi');
  });

  it('falls back to "<year> <make> <model>" when a vehicle has no nickname', async () => {
    useGarageStore.setState({ vehicles: [vehicleFixture({ nickname: null })] });

    await render(<GarageScreen />);

    expect(screen.getByTestId('vehicle-summary-name')).toHaveTextContent('2019 Honda Civic');
  });
});
