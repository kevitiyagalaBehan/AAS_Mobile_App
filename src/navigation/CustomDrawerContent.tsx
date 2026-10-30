import React, { useEffect, useState } from "react";
import {
  DrawerContentScrollView,
  useDrawerStatus,
} from "@react-navigation/drawer";
import { Text, View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getInitials } from "../../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { handleLogout } from "../utils/logout";
import { getLinkedUsers, revokePin, requestPasswordReset } from "../utils/pimsApi";
import {
  clearPinRegistration,
  getPinRegistration,
  hasPinRegistration,
} from "../utils/pinStorage";
import { navigationRef } from "./RootNavigation";
import { DrawerMenuItem } from "./types";
import { colors } from "../theme/colors";

export default function CustomDrawerContent(props: any) {
  const { userData, setCurrentUserName, currentUserName, resetAuthState } =
    useAuth();
  const { navigation, state } = props;
  const menuItems: DrawerMenuItem[] = props.menuItems ?? [];
  const drawerStatus = useDrawerStatus();
  const insets = useSafeAreaInsets();
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState<boolean>(false);

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

  const focusedRouteName = state.routes[state.index].name;

  const renderRow = (
    label: string,
    onPress: () => void,
    options: { focused?: boolean; disabled?: boolean } = {}
  ) => (
    <TouchableOpacity
      key={label}
      style={[styles.row, options.focused && styles.rowFocused]}
      onPress={onPress}
      disabled={options.disabled}
      activeOpacity={0.6}
      accessibilityRole="button"
    >
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.closeDrawer()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <Ionicons name="close" size={26} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>
              {getInitials(currentUserName || "") || "?"}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUserName || "User"}
            </Text>
            {userEmail && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {userEmail}
              </Text>
            )}
          </View>
        </View>

        {menuItems.length > 0 && (
          <View style={styles.section}>
            {/* Each menu item is a full-screen drawer screen; nothing is
                highlighted while the bottom tabs (MainTabs) are open. */}
            {menuItems.map((item) =>
              renderRow(
                item.label,
                () => {
                  navigation.navigate(
                    item.screen,
                    item.tab ? { screen: item.tab } : undefined
                  );
                  navigation.closeDrawer();
                },
                { focused: !item.tab && item.screen === focusedRouteName }
              )
            )}
          </View>
        )}

        <View style={styles.section}>
          {renderRow(hasPin ? "PIN login" : "Set up PIN login", handlePinPress)}
          {renderRow(
            sendingReset ? "Sending..." : "Reset password",
            handleResetPasswordPress,
            { disabled: sendingReset }
          )}
        </View>
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={() => handleLogout(navigation, true, resetAuthState)}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginRight: 4,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: RFPercentage(2),
    letterSpacing: 0.5,
  },
  profileText: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    color: colors.primary,
  },
  subtitle: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 2,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowFocused: {
    backgroundColor: colors.primarySoft,
  },
  rowText: {
    fontSize: RFPercentage(2),
    fontWeight: "600",
    color: colors.primary,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logoutText: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: "#DC2626",
  },
});
