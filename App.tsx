import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ESignProvider } from "./src/context/ESignContext";
import LoginScreen from "./src/screens/LoginScreen";
import DrawerNavigatorOther from "./src/navigation/DrawerNavigatorOther";
import DrawerNavigatorFamily from "./src/navigation/DrawerNavigatorFamily";
import { useVersionCheck } from "./hooks/useVersionCheck";
import UpdateModal from "./components/UpdateModal";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { navigationRef } from "./src/navigation/RootNavigation";
import { InboxNotificationActionData } from "./src/navigation/types";

const Stack = createStackNavigator();

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

  const getInitialScreen = () => {
    if (!userData) return "Login";
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
          name="Other"
          component={DrawerNavigatorOther}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Family"
          component={DrawerNavigatorFamily}
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

          navigationRef.navigate("Login");
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
    <NavigationContainer ref={navigationRef}>
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
