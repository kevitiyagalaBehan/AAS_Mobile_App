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
import { getLinkedUsers, revokePin, requestPasswordReset } from "../utils/pimsApi";
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState<boolean>(false);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userData?.authToken) {
          setCurrentUserName(null);
          setUserEmail(null);
          return;
        }

        const userName = await getLinkedUsers(userData.authToken);
        setCurrentUserName(userName?.fullName || "User");
        setUserEmail(userName?.emailAddress || null);
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

  // Only forget the PIN on this phone once the server confirms it's revoked; otherwise the
  // server keeps the registration and blocks the next user from setting up a PIN here.
  const turnOffPin = async () => {
    const registration = await getPinRegistration();
    if (!registration) {
      setHasPin(false);
      return;
    }

    if (!userData?.authToken) {
      Alert.alert(
        "Session expired",
        "Please log in again, then turn off PIN login."
      );
      return;
    }

    const result = await revokePin(userData.authToken, registration.deviceId);
    if (!result.success) {
      Alert.alert("PIN login is still on", result.message);
      return;
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

  const sendResetEmail = async (email: string) => {
    setSendingReset(true);
    try {
      const result = await requestPasswordReset(email);
      if (!result) {
        throw new Error("Unexpected Error");
      }
      Alert.alert(result.success ? "Success" : "Error", result.message);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to send password reset request"
      );
    } finally {
      setSendingReset(false);
    }
  };

  const handleResetPasswordPress = () => {
    if (sendingReset) return;

    if (!userEmail) {
      Alert.alert(
        "Reset Password",
        "We couldn't find the email address for your account. Please log out and use \"Forgot Password?\" on the login screen."
      );
      return;
    }

    Alert.alert(
      "Reset Password",
      `We'll send a password reset link to ${userEmail}.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: () => sendResetEmail(userEmail) },
      ]
    );
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
        style={styles.resetPasswordButton}
        onPress={handleResetPasswordPress}
        disabled={sendingReset}
      >
        <Ionicons name="key" size={26} color="#00205A" />
        <Text style={styles.resetPasswordText}>
          {sendingReset ? "Sending..." : "Reset Password"}
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
    resetPasswordButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: "#ccc",
    },
    resetPasswordText: {
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
