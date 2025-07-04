import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { handleLogout } from "../src/utils/logout";
import { useAuth } from "../src/context/AuthContext";
import { RootStackParamList } from "../src/navigation/types";

const AUTO_LOGOUT_DELAY = 4 * 60 * 1000;

export const useAutoLogout = () => {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userData } = useAuth();

  const logout = () => {
    console.log("Auto-logout due to background inactivity");
    if (userData?.authToken) {
      handleLogout(navigation, false);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === "active" && nextAppState === "background") {
      backgroundTime.current = Date.now();
    }

    if (
      appState.current.match(/background|inactive/) &&
      nextAppState === "active"
    ) {
      const now = Date.now();
      if (backgroundTime.current) {
        const timeAway = now - backgroundTime.current;
        if (timeAway >= AUTO_LOGOUT_DELAY) {
          logout();
        }
      }
      backgroundTime.current = null;
    }

    appState.current = nextAppState;
  };

  useEffect(() => {
    if (!userData?.authToken) return;

    const appStateSub = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      appStateSub.remove();
    };
  }, [userData?.authToken]);
};
