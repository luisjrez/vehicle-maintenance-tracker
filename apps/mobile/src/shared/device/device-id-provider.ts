export type DeviceIdSources = {
  platform: string;
  /** `ANDROID_ID`: stable per app-signing key, user and device. */
  androidId: () => string | null;
  /** Keychain storage for the iOS Device ID; items survive app reinstalls. */
  keychain: { read: () => Promise<string | null>; write: (value: string) => Promise<void> };
  randomUUID: () => string;
};

/**
 * Builds the Device ID getter (ADR-0001). The value is computed once per app
 * run and shared by concurrent callers; a failed read is not cached, so the
 * next request tries again.
 */
export function createDeviceIdProvider(sources: DeviceIdSources): () => Promise<string> {
  let pending: Promise<string> | null = null;

  async function load(): Promise<string> {
    if (sources.platform === 'android') {
      const androidId = sources.androidId();
      if (androidId !== null && androidId !== '') return androidId;
    }
    const stored = await sources.keychain.read();
    if (stored !== null && stored !== '') return stored;
    const created = sources.randomUUID();
    await sources.keychain.write(created);
    return created;
  }

  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}
