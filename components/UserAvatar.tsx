import { Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

type UserAvatarProps = {
  name?: string | null;
  size?: number;
};

// First letter of the first and last names, e.g. "Isabella Smith" -> "IS"
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

export default function UserAvatar({ name, size = 44 }: UserAvatarProps) {
  const navigation = useNavigation();
  const { loggedInUser, currentUserName } = useAuth();
  const initials = getInitials(
    name || loggedInUser?.fullName || currentUserName || ""
  );

  return (
    <TouchableOpacity
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      activeOpacity={0.7}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      {initials ? (
        <Text style={styles.initials}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color="#fff" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatar: {
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
});
