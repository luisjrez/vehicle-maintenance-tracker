import { fireEvent, render, screen } from '@testing-library/react-native';
import { useGarageStore } from '@/shared/store/garage-store';
import { vehicleFixture } from '@/test/fixtures';
import { jsonResponse, requestBody } from '@/test/http';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { resetGarageStore } from '@/test/store';
import { AddVehicleScreen } from './add-vehicle-screen';

async function skipVin() {
  await fireEvent.press(screen.getByTestId('vin-skip'));
}

async function fillRequiredFields() {
  await fireEvent.changeText(screen.getByTestId('vehicle-year'), '2019');
  await fireEvent.changeText(screen.getByTestId('vehicle-make'), 'Honda');
  await fireEvent.changeText(screen.getByTestId('vehicle-model'), 'Civic');
  await fireEvent.changeText(screen.getByTestId('vehicle-initial-odometer'), '47,750');
}

describe('AddVehicleScreen', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
    fetchMock.mockReset();
  });


  it('requires the initial odometer before calling the API', async () => {
    await render(<AddVehicleScreen />);
    await skipVin();
    await fireEvent.changeText(screen.getByTestId('vehicle-year'), '2019');
    await fireEvent.changeText(screen.getByTestId('vehicle-make'), 'Honda');
    await fireEvent.changeText(screen.getByTestId('vehicle-model'), 'Civic');

    await fireEvent.press(screen.getByTestId('add-vehicle-save'));

    expect(screen.getByTestId('vehicle-initial-odometer-error')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves, stores the API response, selects the vehicle and closes', async () => {
    const created = vehicleFixture({ initialOdometer: 47_750 });
    fetchMock.mockResolvedValue(jsonResponse(201, created));
    await render(<AddVehicleScreen />);
    await skipVin();
    await fillRequiredFields();

    await fireEvent.press(screen.getByTestId('add-vehicle-save'));

    expect(requestBody(0)).toMatchObject({ year: 2019, make: 'Honda', model: 'Civic', initialOdometer: 47_750 });
    expect(useGarageStore.getState().vehicles).toEqual([created]);
    expect(useGarageStore.getState().selectedVehicleId).toBe(created.id);
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('shows the API message when the 20-vehicle cap is reached and keeps the input', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        statusCode: 409,
        error: 'Conflict',
        code: 'VEHICLE_LIMIT_REACHED',
        message: 'You can have up to 20 vehicles. Delete one to add another.',
      }),
    );
    await render(<AddVehicleScreen />);
    await skipVin();
    await fillRequiredFields();

    await fireEvent.press(screen.getByTestId('add-vehicle-save'));

    expect(await screen.findByText('You can have up to 20 vehicles. Delete one to add another.')).toBeTruthy();
    expect(screen.getByTestId('vehicle-make')).toHaveDisplayValue('Honda');
    expect(routerMock.back).not.toHaveBeenCalled();
  });

  it('gives live VIN feedback and only enables the lookup for a valid VIN', async () => {
    await render(<AddVehicleScreen />);

    await fireEvent.changeText(screen.getByTestId('vin-input'), '1HGCM82633A004353');
    expect(screen.getByTestId('vin-input-error')).toHaveTextContent(/typos/);
    expect(screen.getByTestId('vin-look-up')).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId('vin-input'), '1hgcm82633a004352');
    expect(screen.getByTestId('vin-valid')).toBeTruthy();
    expect(screen.getByTestId('vin-look-up')).toBeEnabled();
  });

  it('looks up the VIN, prefills every decoded detail, and saves the VIN with the vehicle', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        vin: '1HGCM82633A004352',
        status: 'decoded',
        modelYearCandidates: [2003],
        details: {
          year: 2003,
          make: 'Honda',
          model: 'Accord',
          trim: 'EX-V6',
          bodyClass: 'Coupe',
          vehicleType: 'Passenger Car',
          fuelType: 'Gasoline',
          electrification: null,
          cylinders: 6,
          displacementL: 3,
          driveType: null,
        },
      }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(201, vehicleFixture({ vin: '1HGCM82633A004352' })));
    await render(<AddVehicleScreen />);
    await fireEvent.changeText(screen.getByTestId('vin-input'), '1HGCM82633A004352');

    await fireEvent.press(screen.getByTestId('vin-look-up'));

    expect(await screen.findByTestId('add-vehicle-notice')).toHaveTextContent(/review/i);
    expect(screen.getByTestId('vehicle-make')).toHaveDisplayValue('Honda');
    expect(screen.getByTestId('vehicle-body-class')).toHaveDisplayValue('Coupe');
    expect(screen.getByTestId('vehicle-cylinders')).toHaveDisplayValue('6');
    await fireEvent.changeText(screen.getByTestId('vehicle-model'), 'Accord Coupe');
    await fireEvent.changeText(screen.getByTestId('vehicle-initial-odometer'), '120000');

    await fireEvent.press(screen.getByTestId('add-vehicle-save'));

    expect(requestBody(1)).toMatchObject({
      vin: '1HGCM82633A004352',
      model: 'Accord Coupe',
      bodyClass: 'Coupe',
      initialOdometer: 120_000,
    });
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('falls back to the manual form when vPIC is unavailable, never blocking', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        vin: '5YJ3E1EA2KF317000',
        status: 'unavailable',
        modelYearCandidates: [2019],
        details: {
          year: null, make: null, model: null, trim: null, bodyClass: null, vehicleType: null,
          fuelType: null, electrification: null, cylinders: null, displacementL: null, driveType: null,
        },
      }),
    );
    await render(<AddVehicleScreen />);
    await fireEvent.changeText(screen.getByTestId('vin-input'), '5YJ3E1EA2KF317000');

    await fireEvent.press(screen.getByTestId('vin-look-up'));

    expect(await screen.findByTestId('add-vehicle-notice')).toHaveTextContent(/unavailable/i);
    expect(screen.getByTestId('vehicle-year')).toHaveDisplayValue('2019');
    expect(screen.getByTestId('vehicle-make')).toHaveDisplayValue('');
  });
});

describe('AddVehicleScreen offline', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
    fetchMock.mockReset();
  });

  it('fails with a retryable error that keeps the form, then succeeds on Retry', async () => {
    const created = vehicleFixture();
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    fetchMock.mockResolvedValueOnce(jsonResponse(201, created));
    await render(<AddVehicleScreen />);
    await skipVin();
    await fillRequiredFields();

    await fireEvent.press(screen.getByTestId('add-vehicle-save'));

    expect(await screen.findByTestId('error-banner')).toHaveTextContent(/offline/i);
    expect(screen.getByTestId('vehicle-model')).toHaveDisplayValue('Civic');
    expect(useGarageStore.getState().vehicles).toEqual([]);

    await fireEvent.press(screen.getByTestId('error-banner-retry'));

    expect(requestBody(1)).toEqual(requestBody(0));
    expect(useGarageStore.getState().vehicles).toEqual([created]);
    expect(routerMock.back).toHaveBeenCalled();
  });
});
