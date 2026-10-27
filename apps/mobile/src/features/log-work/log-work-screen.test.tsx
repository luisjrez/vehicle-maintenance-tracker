import { fireEvent, render, screen } from '@testing-library/react-native';
import { useGarageStore } from '@/shared/store/garage-store';
import { recordFixture, vehicleFixture } from '@/test/fixtures';
import { jsonResponse } from '@/test/http';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { resetGarageStore } from '@/test/store';
import { useLogWorkDraft } from './log-work-draft';
import { LogWorkScreen } from './log-work-screen';

function requestBody(call: number): unknown {
  const [, init] = jest.mocked(globalThis.fetch).mock.calls[call] ?? [];
  return JSON.parse(typeof init?.body === 'string' ? init.body : '{}');
}

describe('LogWorkScreen', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const vehicle = vehicleFixture({ id: 'vehicle-1' });

  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
    fetchMock.mockReset();
    useGarageStore.setState({ vehicles: [vehicle] });
    useLogWorkDraft.getState().start({ vehicleId: vehicle.id, date: '2026-03-04' });
  });

  it('does not leave step 1 without a service', async () => {
    await render(<LogWorkScreen vehicleId={vehicle.id} />);

    await fireEvent.press(screen.getByTestId('log-work-next'));

    expect(screen.getByTestId('log-work-services-error')).toBeTruthy();
    expect(screen.getByTestId('log-work-step-what')).toBeTruthy();
  });

  it('logs work through the three steps and adds it to the history', async () => {
    const saved = recordFixture({ vehicleId: vehicle.id, totalCents: 8_999 });
    fetchMock.mockResolvedValue(jsonResponse(201, saved));
    await render(<LogWorkScreen vehicleId={vehicle.id} />);

    await fireEvent.press(screen.getByTestId('common-service-oil-change'));
    await fireEvent.press(screen.getByTestId('common-service-brake-pads'));
    await fireEvent.press(screen.getByTestId('log-work-next'));

    await fireEvent.changeText(screen.getByTestId('log-work-odometer'), '52,000');
    await fireEvent.changeText(screen.getByTestId('log-work-provider-name'), 'Jiffy Lube');
    await fireEvent.press(screen.getByTestId('provider-type-chain'));
    await fireEvent.press(screen.getByTestId('log-work-next'));

    await fireEvent.changeText(screen.getByTestId('log-work-total'), '89.99');
    await fireEvent.changeText(screen.getByTestId('line-cost-0'), '49.99');
    await fireEvent.press(screen.getByTestId('log-work-save'));

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/v1\/vehicles\/vehicle-1\/records$/), expect.anything());
    expect(requestBody(0)).toEqual({
      date: '2026-03-04',
      odometer: 52_000,
      providerName: 'Jiffy Lube',
      providerType: 'chain',
      totalCents: 8_999,
      lineItems: [
        { serviceSlug: 'oil-change', costCents: 4_999 },
        { serviceSlug: 'brake-pads', notes: 'Front axle' },
      ],
    });
    expect(useGarageStore.getState().records).toEqual([saved]);
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('keeps everything typed when the save fails, and retries', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    fetchMock.mockResolvedValueOnce(jsonResponse(201, recordFixture({ vehicleId: vehicle.id })));
    await render(<LogWorkScreen vehicleId={vehicle.id} />);
    await fireEvent.press(screen.getByTestId('common-service-oil-change'));
    await fireEvent.press(screen.getByTestId('log-work-next'));
    await fireEvent.press(screen.getByTestId('log-work-next'));
    await fireEvent.changeText(screen.getByTestId('log-work-total'), '45');

    await fireEvent.press(screen.getByTestId('log-work-save'));

    expect(await screen.findByTestId('log-work-save-error')).toHaveTextContent(/offline/i);
    expect(screen.getByTestId('log-work-total')).toHaveDisplayValue('45');

    await fireEvent.press(screen.getByTestId('log-work-save-error-retry'));

    expect(requestBody(1)).toEqual(requestBody(0));
    expect(routerMock.back).toHaveBeenCalled();
  });
});

describe('LogWorkScreen odometer consistency', () => {
  const vehicle = vehicleFixture({ id: 'vehicle-1', initialOdometer: 40_000, initialOdometerDate: '2026-01-10' });

  beforeEach(() => {
    resetGarageStore();
    useGarageStore.setState({
      vehicles: [vehicle],
      records: [recordFixture({ id: 'later', vehicleId: 'vehicle-1', date: '2026-06-01', odometer: 50_000 })],
    });
    useLogWorkDraft.getState().start({ vehicleId: vehicle.id, date: '2026-03-04' });
  });

  it('blocks step 2 with a message naming the conflicting reading', async () => {
    await render(<LogWorkScreen vehicleId={vehicle.id} />);
    await fireEvent.press(screen.getByTestId('common-service-oil-change'));
    await fireEvent.press(screen.getByTestId('log-work-next'));

    await fireEvent.changeText(screen.getByTestId('log-work-odometer'), '55000');
    await fireEvent.press(screen.getByTestId('log-work-next'));

    expect(screen.getByTestId('log-work-odometer-error')).toHaveTextContent(
      'The odometer can’t be higher than 50,000 mi, recorded on Jun 1, 2026.',
    );
    expect(screen.getByTestId('log-work-step-when')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('log-work-odometer'), '45000');
    await fireEvent.press(screen.getByTestId('log-work-next'));

    expect(screen.getByTestId('log-work-step-cost')).toBeTruthy();
  });
});
