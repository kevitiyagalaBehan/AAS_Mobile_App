import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../src/context/AuthContext";
import { getLinkedUsers, savePushToken } from "../src/utils/pimsApi";
import { registerForPushNotificationsAsync } from "../src/utils/notification";
import { navigationRef, inboxRoute } from "../src/navigation/RootNavigation";
import {
  LinkedUsers,
  LoginResponse,
  PracticeInfo,
  RootStackParamList,
} from "../src/navigation/types";
import { savePractice } from "../src/utils/practiceStorage";
import { homeRoute } from "../src/utils/userRoute";

export const useSession = () => {
  const {
    setUserData,
    setLoggedInUser,
    pendingNavigation,
    setPendingNavigation,
  } = useAuth();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();

  // Stores the session and the user's practice, and registers for push notifications,
  // without leaving the current screen.
  const startSession = async (
    login: LoginResponse,
    practice: PracticeInfo | null
  ): Promise<LinkedUsers | null> => {
    const { authToken } = login;

    setUserData(login);
    await savePractice(practice);

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

  const enterApp = (login: Pick<LoginResponse, "userRole" | "accountType">) => {
    const userType = homeRoute(login);

    // A notification tapped before login opens a client Inbox. Advisers don't have
    // that screen yet, so they just land on their dashboard.
    if (userType === "Adviser") {
      setPendingNavigation(null);
      navigation.replace("Adviser");
      return;
    }

    if (pendingNavigation) {
      navigation.replace(userType, {});

      setTimeout(() => {
        navigationRef.navigate(
          userType,
          inboxRoute(
            pendingNavigation.screen as "InboxList" | "InboxDetail",
            pendingNavigation.params
          ) as any
        );
      }, 300);

      setPendingNavigation(null);

      return;
    }

    navigation.replace(userType, {});
  };

  return { startSession, enterApp };
};
