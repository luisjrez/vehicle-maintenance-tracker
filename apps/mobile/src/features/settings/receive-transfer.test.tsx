import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { transferQrPayload } from '@vmt/shared';
import { Alert, type AlertButton } from 'react-native';
import { useScanRequestStore } from '@/shared/scanner/scan-request-store';
import { useGarageStore } from '@/shared/store/garage-store';
import { vehicleFixture } from '@/test/fixtures';
import { jsonResponse } from '@/test/http';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { resetGarageStore } from '@/test/store';
import { SettingsScreen } from './settings-screen';

const code = 'c'.repeat(43);

function urlOf(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
}

function respond(responses: Record<string, () => Response>) {
  return (input: string | URL | Request): Promise<Response> => {
    const url = urlOf(input);
    const match = Object.keys(responses).find((path) => url.endsWith(path));
    if (url.endsWith('/v1/health')) return Promise.resolve(jsonResponse(200, { status: 'ok', database: 'up' }));
    return Promise.resolve(match === undefined ? jsonResponse(200, []) : (responses[match]?.() ?? jsonResponse(500, {})));
  };
}

function redeemBodies(): unknown[] {
  return jest
    .mocked(globalThis.fetch)
    .mock.calls.filter(([url]) => urlOf(url).endsWith('/v1/transfer-codes/redeem'))
    .map(([, init]) => (typeof init?.body === 'string' ? JSON.parse(init.body) : undefined));
}

async function scan(value: string) {
  await fireEvent.press(screen.getByTestId('settings-receive'));
  expect(routerMock.push).toHaveBeenCalledWith({ pathname: '/scanner', params: { mode: 'qr' } });
  await act(async () => {
    useScanRequestStore.getState().deliver(value);
  });
}

describe('Receive from another phone', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const alertMock = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
    fetchMock.mockReset();
    alertMock.mockReset();
    useScanRequestStore.getState().clear();
  });


  it('explains that there is no account', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByTestId('settings-no-account')).toHaveTextContent(/There is no account/);
  });

  it('redeems the scanned code and reloads the garage', async () => {
    fetchMock.mockImplementation(
      respond({
        '/v1/transfer-codes/redeem': () => jsonResponse(200, { vehicleCount: 1 }),
        '/v1/owner': () => jsonResponse(200, { createdAt: '2026-01-01T00:00:00.000Z', vehicleCount: 1 }),
        '/v1/vehicles': () => jsonResponse(200, [vehicleFixture({ id: 'moved' })]),
      }),
    );
    await render(<SettingsScreen />);

    await scan(transferQrPayload(code));

    expect(await screen.findByTestId('settings-receive-done')).toHaveTextContent('Done. 1 vehicle moved to this phone.');
    expect(redeemBodies()).toEqual([{ code, replaceExisting: false }]);
    expect(useGarageStore.getState().vehicles.map((vehicle) => vehicle.id)).toEqual(['moved']);
  });

  it('warns how many vehicles will be deleted and replaces them only after confirmation', async () => {
    useGarageStore.setState({ vehicles: [vehicleFixture(), vehicleFixture()] });
    let redeemCalls = 0;
    fetchMock.mockImplementation(
      respond({
        '/v1/transfer-codes/redeem': () => {
          redeemCalls += 1;
          return redeemCalls === 1
            ? jsonResponse(409, {
                statusCode: 409,
                code: 'TRANSFER_CONFLICT',
                message: 'This phone has 2 vehicles; they will be deleted and replaced.',
                details: { vehicleCount: 2 },
              })
            : jsonResponse(200, { vehicleCount: 3 });
        },
      }),
    );
    await render(<SettingsScreen />);

    await scan(transferQrPayload(code));

    await waitFor(() => expect(alertMock).toHaveBeenCalled());
    expect(alertMock.mock.calls[0]?.[1]).toBe('This phone has 2 vehicles; they will be deleted and replaced.');
    const buttons: AlertButton[] = alertMock.mock.calls[0]?.[2] ?? [];
    await act(async () => {
      buttons.find((button) => button.style === 'destructive')?.onPress?.();
    });

    expect(await screen.findByTestId('settings-receive-done')).toHaveTextContent(/3 vehicles/);
    expect(redeemBodies()).toEqual([{ code, replaceExisting: false }, { code, replaceExisting: true }]);
  });

  it('rejects a QR that is not a transfer code', async () => {
    await render(<SettingsScreen />);

    await scan('https://example.com');

    expect(screen.getByTestId('settings-receive-error')).toHaveTextContent(/isn't a transfer code/);
    expect(redeemBodies()).toEqual([]);
  });
});
