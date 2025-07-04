import { NavigationProp } from "@react-navigation/native";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleLogout = async (
  navigation: NavigationProp<any>,
  showConfirmation: boolean = true,
  authContextReset?: () => void
) => {
  if (showConfirmation) {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await performLogout(navigation, authContextReset);
        },
      },
    ]);
  } else {
    await performLogout(navigation, authContextReset);
  }
};

const performLogout = async (
  navigation: NavigationProp<any>,
  authContextReset?: () => void
) => {
  try {
    await AsyncStorage.clear();

    if (authContextReset) {
      authContextReset();
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
