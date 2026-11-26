import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AdviserHomeScreen from "../screens/AdviserHomeScreen";
import AdviserComingSoonScreen from "../screens/AdviserComingSoonScreen";
import { useAdviserBadges } from "../context/AdviserBadgeContext";
import { BottomTabParamListAdviser } from "./types";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator<BottomTabParamListAdviser>();

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tabIcon =
  (name: IconName, badge = 0) =>
  ({ color, size }: { color: string; size: number }) => (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      )}
    </View>
  );

export default function BottomTabAdviser() {
  const { counts } = useAdviserBadges();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarStyle = {
    height: height * 0.075 + insets.bottom,
    paddingTop: height * 0.008,
    paddingBottom: insets.bottom,
  };

  return (
    <Tab.Navigator
      initialRouteName="AdviserHome"
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.link,
        tabBarLabelStyle: { fontSize: RFPercentage(1.4), fontWeight: "bold" },
      }}
    >
      <Tab.Screen
        name="AdviserHome"
        component={AdviserHomeScreen}
        options={{ tabBarLabel: "Home", tabBarIcon: tabIcon("home") }}
      />
      <Tab.Screen
        name="AdviserAccounts"
        component={AdviserComingSoonScreen}
        options={{ tabBarLabel: "Accounts", tabBarIcon: tabIcon("people") }}
      />
      <Tab.Screen
        name="AdviserJobs"
        component={AdviserComingSoonScreen}
        options={{ tabBarLabel: "Jobs", tabBarIcon: tabIcon("briefcase") }}
      />
      <Tab.Screen
        name="AdviserQueries"
        component={AdviserComingSoonScreen}
        options={{
          tabBarLabel: "Queries",
          tabBarIcon: tabIcon("help-circle", counts.unansweredQueries),
          tabBarAccessibilityLabel:
            counts.unansweredQueries > 0
              ? `Queries, ${counts.unansweredQueries} unanswered`
              : "Queries",
        }}
      />
      <Tab.Screen
        name="AdviserInbox"
        component={AdviserComingSoonScreen}
        options={{
          tabBarLabel: "Inbox",
          tabBarIcon: tabIcon("mail", counts.unreadInbox),
          tabBarAccessibilityLabel:
            counts.unreadInbox > 0 ? `Inbox, ${counts.unreadInbox} unread` : "Inbox",
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -10,
    top: -5,
    backgroundColor: "#C2410C",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
