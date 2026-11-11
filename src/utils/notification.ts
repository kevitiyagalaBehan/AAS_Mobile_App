import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type ExpoPushToken = string | null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PUSH_TOKEN_TIMEOUT_MS = 5000;

// Returns the push token only if notification permission was already granted; never prompts.
// Times out so a slow network can't hold up login or device registration.
export async function getPushTokenIfPermitted(): Promise<ExpoPushToken> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return null;

    const tokenPromise = Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    }).then((result) => result.data);

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), PUSH_TOKEN_TIMEOUT_MS)
    );

    return await Promise.race([tokenPromise, timeout]);
  } catch (error) {
    console.warn("getPushTokenIfPermitted error", error);
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<ExpoPushToken> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notifications permission not granted.");
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;
    //console.log("Expo Push Token:", token);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (error) {
    console.error("registerForPushNotificationsAsync error", error);
    return null;
  }
}
