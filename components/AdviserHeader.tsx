import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import { useAdviserBadges } from "../src/context/AdviserBadgeContext";
import { colors } from "../src/theme/colors";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Greeting plus search, notifications and menu buttons for the adviser Home screen
export default function AdviserHeader() {
  const { userData, loggedInUser } = useAuth();
  const { counts } = useAdviserBadges();
  const navigation = useNavigation<any>();
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  // The server sends first_name for advisers; older servers only give the linked user's full name
  const firstName =
    userData?.firstName || loggedInUser?.fullName?.trim().split(" ")[0] || "";

  const hasNotifications = counts.unreadNotifications > 0;

  return (
    <View style={styles.row}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
        <Text style={styles.nameText} numberOfLines={1}>
          {firstName}
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            Alert.alert("Notifications", "Notifications are coming soon.")
          }
          activeOpacity={0.7}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={
            hasNotifications ? "Notifications, unread" : "Notifications"
          }
        >
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          {hasNotifications && <View style={styles.dot} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.7}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: height * 0.02,
      marginBottom: height * 0.015,
    },
    greeting: {
      flex: 1,
      marginRight: width * 0.03,
    },
    greetingText: {
      fontSize: RFPercentage(1.9),
      color: "#5A6478",
    },
    nameText: {
      fontSize: RFPercentage(2.8),
      fontWeight: "bold",
      color: colors.primary,
    },
    buttons: {
      flexDirection: "row",
      gap: 10,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
    dot: {
      position: "absolute",
      top: 10,
      right: 11,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#E4572E",
      borderWidth: 1.5,
      borderColor: "#fff",
    },
  });
