import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiHealthStatus } from './api-health-status';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('ApiHealthStatus', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('shows Connected when the health check succeeds', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: 'ok', database: 'up' }));

    await render(<ApiHealthStatus />);

    expect(await screen.findByText('Connected')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/health$/),
      expect.objectContaining({ headers: expect.objectContaining({ 'x-device-id': expect.any(String) }) }),
    );
  });

  it('shows Unreachable and lets the Owner retry', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: 'ok', database: 'up' }));

    await render(<ApiHealthStatus />);
    expect(await screen.findByText('Unreachable')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('api-health-retry'));

    expect(await screen.findByText('Connected')).toBeTruthy();
  });
});
