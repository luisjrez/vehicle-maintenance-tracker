import * as Application from 'expo-application';
import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createDeviceIdProvider } from './device-id-provider';

const KEYCHAIN_KEY = 'vmt.device-id';
// THIS_DEVICE_ONLY keeps the credential out of iCloud backups: moving to a new
// phone must go through an explicit transfer code, never a restored backup.
const keychainOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** The Device ID sent as `X-Device-Id`. A secret: never log or display it. */
export const getDeviceId = createDeviceIdProvider({
  platform: Platform.OS,
  androidId: () => (Platform.OS === 'android' ? Application.getAndroidId() : null),
  keychain: {
    read: () => SecureStore.getItemAsync(KEYCHAIN_KEY, keychainOptions),
    write: (value) => SecureStore.setItemAsync(KEYCHAIN_KEY, value, keychainOptions),
  },
  randomUUID,
});
