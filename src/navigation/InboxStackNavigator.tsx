import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import InboxList from "../screens/InboxListScreen";
import { InboxStackParamList } from "./types";
import InboxDetail from "../screens/InboxDetailScreen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

const Stack = createStackNavigator<InboxStackParamList>();

export default function InboxStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        //headerShown: true,
        headerTitleStyle: {
          fontSize: RFPercentage(2.6),
          color: colors.primary,
          fontWeight: "bold",
        },
        headerTintColor: colors.primary,
        // The library's default back-arrow image doesn't render on this setup,
        // so draw the arrow with an icon instead
        headerBackImage: ({ tintColor }) => (
          <Ionicons
            name="chevron-back"
            size={28}
            color={tintColor}
            style={{ marginLeft: Platform.OS === "ios" ? 8 : 0 }}
          />
        ),
        headerBackButtonDisplayMode: "minimal",
        headerBackAccessibilityLabel: "Back to inbox",
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
      }}
    >
      <Stack.Screen
        name="InboxList"
        component={InboxList}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="InboxDetail"
        component={InboxDetail}
        options={{
          title: "Inbox Details",
          // Left-aligned and a bit smaller so long subjects show more text
          headerTitleAlign: "left",
          headerTitleStyle: {
            fontSize: RFPercentage(2.2),
            color: colors.primary,
            fontWeight: "bold",
          },
          headerStyle: {
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      />
    </Stack.Navigator>
  );
}
