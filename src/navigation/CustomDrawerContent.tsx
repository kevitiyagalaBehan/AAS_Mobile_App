import React, { useEffect, useState } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
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
import { getLinkedUsers, requestPasswordReset } from "../utils/pimsApi";

export default function CustomDrawerContent(props: any) {
  const { userData, setCurrentUserName, currentUserName, resetAuthState } =
    useAuth();
  const { navigation } = props;
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
