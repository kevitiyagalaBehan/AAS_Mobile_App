import React, { useEffect, useState } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
  useDrawerStatus,
} from "@react-navigation/drawer";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { handleLogout } from "../utils/logout";
import { getLinkedUsers, revokePin } from "../utils/pimsApi";
import {
  clearPinRegistration,
  getPinRegistration,
  hasPinRegistration,
} from "../utils/pinStorage";
import { navigationRef } from "./RootNavigation";

export default function CustomDrawerContent(props: any) {
  const { userData, setCurrentUserName, currentUserName, resetAuthState } =
    useAuth();
  const { navigation } = props;
  const drawerStatus = useDrawerStatus();
  const [hasPin, setHasPin] = useState<boolean>(false);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userData?.authToken) {
          setCurrentUserName(null);
          return;
        }

        const userName = await getLinkedUsers(userData.authToken);
        setCurrentUserName(userName?.fullName || "User");
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setCurrentUserName("Error loading user");
      }
    };

    fetchUserData();
  }, [userData?.authToken]);

  // Re-check each time the drawer opens, since PIN setup happens on another screen.
  useEffect(() => {
    if (drawerStatus === "open") {
      hasPinRegistration().then(setHasPin);
    }
  }, [drawerStatus]);

  const openPinSetup = () => {
    navigation.closeDrawer();
    navigationRef.navigate("PinSetup", { mode: "settings" });
  };

  const turnOffPin = async () => {
    const registration = await getPinRegistration();
    if (registration && userData?.authToken) {
      await revokePin(userData.authToken, registration.deviceId);
    }
    await clearPinRegistration();
    setHasPin(false);
    Alert.alert(
      "PIN login turned off",
      "You'll need your password to log in on this device."
    );
  };

  const handlePinPress = () => {
    if (!hasPin) {
      openPinSetup();
      return;
    }

    Alert.alert("PIN Login", "PIN login is on for this device.", [
      { text: "Change PIN", onPress: openPinSetup },
      { text: "Turn Off", style: "destructive", onPress: turnOffPin },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <Image
          source={require("../../assets/aas_logo.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.userName}>
          Welcome, {currentUserName || "User"}
        </Text>
      </View>

      <DrawerItemList {...props} />

      <TouchableOpacity style={styles.pinButton} onPress={handlePinPress}>
        <Ionicons name="keypad" size={26} color="#00205A" />
        <Text style={styles.pinText}>
          {hasPin ? "PIN Login" : "Set Up PIN Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => handleLogout(navigation, true, resetAuthState)}
      >
        <Ionicons name="log-out" size={30} color="red" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    headerContainer: {
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
    },
    image: {
      width: width * 1,
      height: height * 0.08,
    },
    userName: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      marginTop: height * 0.01,
    },
    pinButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: "#ccc",
    },
    pinText: {
      fontSize: RFPercentage(2),
      color: "#00205A",
      fontWeight: "bold",
      marginLeft: width * 0.03,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: "#ccc",
    },
    logoutText: {
      fontSize: RFPercentage(2),
      color: "red",
      fontWeight: "bold",
      marginLeft: width * 0.03,
    },
  });
