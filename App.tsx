import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ESignProvider } from "./src/context/ESignContext";
import LoginScreen from "./src/screens/LoginScreen";
import PinLoginScreen from "./src/screens/PinLoginScreen";
import PinSetupScreen from "./src/screens/PinSetupScreen";
import PdfViewerScreen from "./src/screens/PdfViewerScreen";
import DrawerNavigatorOther from "./src/navigation/DrawerNavigatorOther";
import DrawerNavigatorFamily from "./src/navigation/DrawerNavigatorFamily";
import { useVersionCheck } from "./hooks/useVersionCheck";
import UpdateModal from "./components/UpdateModal";
import { useEffect, useState } from "react";
import { getLoginRoute } from "./src/utils/pinStorage";
import * as Notifications from "expo-notifications";
import { navigationRef } from "./src/navigation/RootNavigation";
import {
  InboxNotificationActionData,
  RootStackParamList,
} from "./src/navigation/types";
import { colors } from "./src/theme/colors";

const Stack = createStackNavigator<RootStackParamList>();

// Tab bar, drawer and header highlights use the theme's primary colour
const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary },
};

function AppNavigator() {
  const { userData } = useAuth();
  const { forceBlock, updateUrl } = useVersionCheck();

  // useEffect(() => {
  //   registerForPushNotificationsAsync().then((token) => {
  //     if (token) {
  //       console.log("Device push token:", token);
  //     }
  //   });
  // }, []);

  const [loginRoute, setLoginRoute] = useState<"Login" | "PinLogin" | null>(
    null
  );

  useEffect(() => {
    getLoginRoute().then(setLoginRoute);
  }, []);

  // Wait until we know whether this device has a PIN, so the right login screen opens first.
  if (!loginRoute) return null;

  const getInitialScreen = () => {
    if (!userData) return loginRoute;
    return userData.accountType === "Family Group" ? "Family" : "Other";
  };

  return (
    <>
      <UpdateModal visible={forceBlock} updateUrl={updateUrl} />

      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Navigator initialRouteName={getInitialScreen()}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PinLogin"
          component={PinLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PinSetup"
          component={PinSetupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Other"
          component={DrawerNavigatorOther}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Family"
          component={DrawerNavigatorFamily}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PdfViewer"
          component={PdfViewerScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </>
  );
}

function AppInner() {
  const { userData, setPendingNavigation } = useAuth();
  const isLoggedIn = !!userData?.authToken;
  const userType =
    userData?.accountType === "Family Group" ? "Family" : "Other";

  useEffect(() => {
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        let actionData: InboxNotificationActionData;

        try {
          actionData =
            typeof data.action_data === "string"
              ? JSON.parse(data.action_data)
              : data.action_data;
        } catch (err) {
          console.error("Failed to parse action_data", err);
          return;
        }

        if (!isLoggedIn) {
          setPendingNavigation({
            userType,
            screen: data.action === "NEW_MESSAGE" ? "InboxList" : "InboxDetail",
            params: {
              queryId: actionData.MessageId,
              title:
                data.action === "NEW_MESSAGE" ? "AAS New Message" : "AAS Reply",
            },
          });

          getLoginRoute().then((route) => navigationRef.navigate(route));
          return;
        }

        navigationRef.navigate(userType, {
          screen: "MainTabs",
          params: {
            screen: "Inbox",
            params: {
              screen:
                data.action === "NEW_MESSAGE" ? "InboxList" : "InboxDetail",
              params: {
                queryId: actionData.MessageId,
                title:
                  data.action === "NEW_MESSAGE"
                    ? "AAS New Message"
                    : "AAS Reply",
              },
            },
          },
        });
      });

    return () => {
      responseListener.remove();
    };
  }, [isLoggedIn, userType]);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ESignProvider>
          <AppInner />
        </ESignProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
