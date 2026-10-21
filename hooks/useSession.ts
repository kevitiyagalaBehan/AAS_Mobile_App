import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../src/context/AuthContext";
import { getLinkedUsers, savePushToken } from "../src/utils/pimsApi";
import { registerForPushNotificationsAsync } from "../src/utils/notification";
import { navigationRef } from "../src/navigation/RootNavigation";
import {
  LinkedUsers,
  LoginResponse,
  RootStackParamList,
} from "../src/navigation/types";

export const useSession = () => {
  const {
    setUserData,
    setLoggedInUser,
    pendingNavigation,
    setPendingNavigation,
  } = useAuth();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();

  // Stores the session and registers for push notifications, without leaving the current screen.
  const startSession = async (
    login: LoginResponse
  ): Promise<LinkedUsers | null> => {
    const { authToken, accountId, accountType } = login;

    setUserData({ authToken, accountId, accountType });

    const linkedUser = await getLinkedUsers(authToken);
    if (linkedUser) {
      setLoggedInUser(linkedUser);
    } else {
      console.warn("No linked user found!");
    }

    const expoPushToken = await registerForPushNotificationsAsync();

    if (expoPushToken) {
      await savePushToken(expoPushToken, authToken);
    } else {
      console.warn("Failed to retrieve Expo push token");
    }

    return linkedUser;
  };

  const enterApp = (accountType: string) => {
    const userType = accountType === "Family Group" ? "Family" : "Other";

    if (pendingNavigation) {
      navigation.replace(userType, {});

      setTimeout(() => {
        navigationRef.navigate(userType, {
          screen: "MainTabs",
          params: {
            screen: "Inbox",
            params: {
              screen: pendingNavigation.screen,
              params: pendingNavigation.params,
            },
          },
        });
      }, 300);

      setPendingNavigation(null);

      return;
    }

    navigation.replace(userType, {});
  };

  return { startSession, enterApp };
};
