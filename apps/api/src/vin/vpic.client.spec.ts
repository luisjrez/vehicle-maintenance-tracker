import { loadEnv } from '../config/env.js';
import { VpicClient } from './vpic.client.js';

const env = loadEnv({
  DATABASE_URL: 'postgresql://unused@localhost/unused',
  DEVICE_ID_HASH_SECRET: 'x'.repeat(32),
  VPIC_TIMEOUT_MS: '50',
});

describe('VpicClient', () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch');

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('retries once after a server error', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ Results: [] }));

    await expect(new VpicClient(env).fetchDecode('1HGCM82633A004352')).resolves.toEqual({ Results: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up with null after two transport failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(new VpicClient(env).fetchDecode('1HGCM82633A004352')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
