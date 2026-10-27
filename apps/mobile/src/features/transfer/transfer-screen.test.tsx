import { fireEvent, render, screen } from '@testing-library/react-native';
import { jsonResponse } from '@/test/http';
import { TransferScreen } from './transfer-screen';

describe('TransferScreen', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('shows a QR with a 10-minute countdown and the loss-of-access warning', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { code: 'a'.repeat(43), expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() }),
    );

    await render(<TransferScreen />);

    expect(await screen.findByTestId('transfer-qr')).toBeTruthy();
    expect(screen.getByTestId('transfer-countdown')).toHaveTextContent(/Expires in (10:00|9:5\d)/);
    expect(screen.getByTestId('transfer-warning')).toHaveTextContent(/this phone loses access/);
  });

  it('generates a new code on request and shows expiry', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { code: 'a'.repeat(43), expiresAt: new Date(Date.now() - 1000).toISOString() }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, { code: 'b'.repeat(43), expiresAt: new Date(Date.now() + 600_000).toISOString() }),
    );
    await render(<TransferScreen />);
    expect(await screen.findByTestId('transfer-expired')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('transfer-generate'));

    expect(await screen.findByTestId('transfer-qr')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
