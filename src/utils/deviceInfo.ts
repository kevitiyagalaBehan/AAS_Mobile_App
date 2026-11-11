import { Platform } from "react-native";
import * as Application from "expo-application";
import { getDeviceId } from "./pinStorage";
import { getPushTokenIfPermitted } from "./notification";
import { DeviceInfo } from "../navigation/types";

// Android only reports these through Platform.constants (Release = "14", Model = "SM-S918B").
const androidConstants = Platform.constants as {
  Release?: string;
  Manufacturer?: string;
  Model?: string;
};

const getOsVersion = (): string =>
  androidConstants.Release || String(Platform.Version);

const getDeviceModel = (): string => {
  const { Manufacturer, Model } = androidConstants;
  const model = [Manufacturer, Model].filter(Boolean).join(" ").trim();
  return model || "Unknown";
};

// Builds the deviceInfo object the /mobile-auth endpoints expect.
export const buildDeviceInfo = async (): Promise<DeviceInfo> => {
  const [deviceId, pushToken] = await Promise.all([
    getDeviceId(),
    getPushTokenIfPermitted(),
  ]);

  return {
    deviceId,
    platform: Platform.OS,
    osVersion: getOsVersion(),
    deviceModel: getDeviceModel(),
    appVersion: Application.nativeApplicationVersion ?? "Unknown",
    buildNumber: Application.nativeBuildVersion ?? "Unknown",
    pushToken,
  };
};
