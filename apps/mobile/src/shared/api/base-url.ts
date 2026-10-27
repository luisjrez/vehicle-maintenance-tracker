const API_PORT = 3020;

type BaseUrlSources = {
  /** `EXPO_PUBLIC_API_URL`, baked in at bundle time. */
  configuredUrl: string | undefined;
  /** Metro's `host:port` in dev builds, e.g. `192.168.1.20:8081`. */
  metroHostUri: string | undefined;
};

/**
 * Production builds set EXPO_PUBLIC_API_URL. In development we reuse the host
 * that serves the bundle, so simulators and phones on the same Wi-Fi both work.
 */
export function resolveApiBaseUrl({ configuredUrl, metroHostUri }: BaseUrlSources): string {
  if (configuredUrl !== undefined && configuredUrl.trim() !== '') {
    return configuredUrl.trim().replace(/\/+$/, '');
  }
  const host = metroHostUri?.split(':')[0];
  return `http://${host === undefined || host === '' ? 'localhost' : host}:${API_PORT}`;
}
