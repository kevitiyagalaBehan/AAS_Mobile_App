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

const Stack = createStackNavigator();

function AppNavigator() {
  const { userData } = useAuth();
  const { forceBlock, updateUrl } = useVersionCheck();

  const getInitialScreen = () => {
    if (!userData) return "Login";
    return userData.accountType === "Family Group" ? "Family" : "Other";
  };

  return (
    <>
    <UpdateModal visible={forceBlock} updateUrl={updateUrl} />
      <NavigationContainer>
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
    </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ESignProvider>
          <AppNavigator />
        </ESignProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
