import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLoginRoute } from "./pinStorage";
import { logoutAllDevices } from "./pimsApi";
import { navigationRef } from "../navigation/RootNavigation";

export const handleLogout = async (
  showConfirmation: boolean = true,
  authContextReset?: () => void,
  authToken?: string
) => {
  if (showConfirmation) {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await performLogout(authContextReset, authToken);
        },
      },
    ]);
  } else {
    await performLogout(authContextReset, authToken);
  }
};

const performLogout = async (
  authContextReset?: () => void,
  authToken?: string
) => {
  // Not awaited: it only updates a status on the server, so logout never waits on the network.
  if (authToken) logoutAllDevices(authToken);

  try {
    // The PIN registration lives in SecureStore, so it survives the AsyncStorage clear below.
    const loginRoute = await getLoginRoute();

    // Reset the root stack: a drawer or tab navigator can't handle a reset to
    // the login screens, and silently ignores it. Leave the app before clearing
    // the session so no screen renders without user data.
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: loginRoute }],
      });
    }

    await AsyncStorage.clear();

    if (authContextReset) {
      authContextReset();
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
