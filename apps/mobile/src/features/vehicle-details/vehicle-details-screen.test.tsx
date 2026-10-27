import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { useGarageStore } from '@/shared/store/garage-store';
import { recordFixture, vehicleFixture } from '@/test/fixtures';
import { jsonResponse, requestBody, requestMethod } from '@/test/http';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { resetGarageStore } from '@/test/store';
import { VehicleDetailsScreen } from './vehicle-details-screen';

describe('VehicleDetailsScreen', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const alertMock = jest.spyOn(Alert, 'alert');
  const vehicle = vehicleFixture({ id: 'vehicle-1', nickname: 'Daily', vin: '1HGCM82633A004352', bodyClass: 'Coupe' });

  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
    fetchMock.mockReset();
    alertMock.mockReset();
    useGarageStore.setState({
      vehicles: [vehicle],
      records: [recordFixture({ vehicleId: 'vehicle-1' }), recordFixture({ vehicleId: 'vehicle-1' }), recordFixture({ vehicleId: 'other' })],
    });
  });

  it('shows every field, including decoded details and the VIN', async () => {
    await render(<VehicleDetailsScreen vehicleId="vehicle-1" />);

    expect(screen.getByTestId('vehicle-vin')).toHaveDisplayValue('1HGCM82633A004352');
    expect(screen.getByTestId('vehicle-body-class')).toHaveDisplayValue('Coupe');
    expect(screen.getByTestId('vehicle-nickname')).toHaveDisplayValue('Daily');
  });

  it('saves edits, clearing blanked fields, and updates the store from the response', async () => {
    const updated = { ...vehicle, nickname: null, bodyClass: 'Sedan' };
    fetchMock.mockResolvedValue(jsonResponse(200, updated));
    await render(<VehicleDetailsScreen vehicleId="vehicle-1" />);

    await fireEvent.changeText(screen.getByTestId('vehicle-nickname'), '');
    await fireEvent.changeText(screen.getByTestId('vehicle-body-class'), 'Sedan');
    await fireEvent.press(screen.getByTestId('vehicle-details-save'));

    expect(requestMethod(0)).toBe('PATCH');
    expect(requestBody(0)).toMatchObject({
      nickname: null,
      bodyClass: 'Sedan',
      vin: '1HGCM82633A004352',
    });
    expect(useGarageStore.getState().vehicles).toEqual([updated]);
    expect(await screen.findByTestId('vehicle-details-saved')).toBeTruthy();
  });

  it('blocks saving an invalid VIN', async () => {
    await render(<VehicleDetailsScreen vehicleId="vehicle-1" />);

    await fireEvent.changeText(screen.getByTestId('vehicle-vin'), '1HGCM82633A004353');
    await fireEvent.press(screen.getByTestId('vehicle-details-save'));

    expect(screen.getByTestId('vehicle-vin-error')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('confirms with the number of records that will be lost, then deletes vehicle and records', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await render(<VehicleDetailsScreen vehicleId="vehicle-1" />);

    await fireEvent.press(screen.getByTestId('vehicle-details-delete'));

    expect(alertMock).toHaveBeenCalledWith(
      'Delete Daily?',
      'This permanently deletes the vehicle and its 2 service records. This cannot be undone.',
      expect.any(Array),
    );
    const buttons: AlertButton[] = alertMock.mock.calls[0]?.[2] ?? [];
    await act(async () => {
      buttons.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(requestMethod(0)).toBe('DELETE');
    expect(useGarageStore.getState().vehicles).toEqual([]);
    expect(useGarageStore.getState().records.map((record) => record.vehicleId)).toEqual(['other']);
  });
});
