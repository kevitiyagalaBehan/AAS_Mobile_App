import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// Stored in the iOS Keychain / Android Keystore. AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
// keeps the values out of backups so the PIN registration can't move to another device.
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const KEYS = {
  deviceId: "pin_device_id",
  deviceToken: "pin_device_token",
  displayName: "pin_display_name",
};

export interface PinRegistration {
  deviceId: string;
  deviceToken: string;
  displayName: string | null;
}

export const getDeviceId = async (): Promise<string> => {
  const existing = await SecureStore.getItemAsync(KEYS.deviceId, STORE_OPTIONS);
  if (existing) return existing;

  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(KEYS.deviceId, deviceId, STORE_OPTIONS);
  return deviceId;
};

export const getPinRegistration = async (): Promise<PinRegistration | null> => {
  try {
    const [deviceId, deviceToken, displayName] = await Promise.all([
      SecureStore.getItemAsync(KEYS.deviceId, STORE_OPTIONS),
      SecureStore.getItemAsync(KEYS.deviceToken, STORE_OPTIONS),
      SecureStore.getItemAsync(KEYS.displayName, STORE_OPTIONS),
    ]);

    if (!deviceId || !deviceToken) return null;

    return { deviceId, deviceToken, displayName };
  } catch (error) {
    console.error("Failed to read PIN registration:", error);
    return null;
  }
};

export const hasPinRegistration = async (): Promise<boolean> =>
  (await getPinRegistration()) !== null;

export const savePinRegistration = async (
  deviceToken: string,
  displayName: string | null
) => {
  await SecureStore.setItemAsync(KEYS.deviceToken, deviceToken, STORE_OPTIONS);
  if (displayName) {
    await SecureStore.setItemAsync(KEYS.displayName, displayName, STORE_OPTIONS);
  } else {
    await SecureStore.deleteItemAsync(KEYS.displayName, STORE_OPTIONS);
  }
};

export const updateDeviceToken = async (deviceToken: string) => {
  await SecureStore.setItemAsync(KEYS.deviceToken, deviceToken, STORE_OPTIONS);
};

// Keeps the device ID so the server can match a later re-registration to this device.
export const clearPinRegistration = async () => {
  try {
    await SecureStore.deleteItemAsync(KEYS.deviceToken, STORE_OPTIONS);
    await SecureStore.deleteItemAsync(KEYS.displayName, STORE_OPTIONS);
  } catch (error) {
    console.error("Failed to clear PIN registration:", error);
  }
};

export const getLoginRoute = async (): Promise<"Login" | "PinLogin"> =>
  (await hasPinRegistration()) ? "PinLogin" : "Login";

// Rejects PINs that are trivially guessable: all one digit, or straight runs like 123456 / 654321.
export const isWeakPin = (pin: string): boolean => {
  if (/^(\d)\1+$/.test(pin)) return true;

  const digits = pin.split("").map(Number);
  const ascending = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
  const descending = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
  return ascending || descending;
};

export const PIN_LENGTH = 6;
