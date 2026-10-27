import { resolveApiBaseUrl } from './base-url';

describe('resolveApiBaseUrl', () => {
  it('prefers the configured URL and trims a trailing slash', () => {
    expect(resolveApiBaseUrl({ configuredUrl: 'https://api.example.com/', metroHostUri: '10.0.0.2:8081' })).toBe(
      'https://api.example.com',
    );
  });

  it('falls back to the Metro host so a phone on the same network reaches the API', () => {
    expect(resolveApiBaseUrl({ configuredUrl: undefined, metroHostUri: '192.168.1.20:8081' })).toBe(
      'http://192.168.1.20:3020',
    );
  });

  it('uses localhost when nothing else is known', () => {
    expect(resolveApiBaseUrl({ configuredUrl: '', metroHostUri: undefined })).toBe('http://localhost:3020');
  });
});
