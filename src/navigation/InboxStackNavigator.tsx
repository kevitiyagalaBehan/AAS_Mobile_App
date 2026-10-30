import React from "react";
import {
  createStackNavigator,
  StackNavigationOptions,
} from "@react-navigation/stack";
import InboxList from "../screens/InboxListScreen";
import { InboxStackParamList } from "./types";
import InboxDetail from "../screens/InboxDetailScreen";
import NewMessageScreen from "../screens/NewMessageScreen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

const Stack = createStackNavigator<InboxStackParamList>();

// iMessage-style header: "< Messages" on the left, title centred.
// A notification can open a conversation with no list underneath, so fall back to it.
const conversationHeader = ({
  navigation,
}: {
  navigation: any;
}): StackNavigationOptions => ({
  headerTitleAlign: "center",
  headerTitleStyle: {
    fontSize: RFPercentage(2.1),
    color: colors.primary,
    fontWeight: "bold",
    maxWidth: 200,
  },
  headerLeft: () => (
    <TouchableOpacity
      onPress={() =>
        navigation.canGoBack()
          ? navigation.goBack()
          : navigation.replace("InboxList")
      }
      hitSlop={10}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel="Back to messages"
    >
      <Ionicons name="chevron-back" size={22} color={colors.link} />
      <Text style={styles.backText}>Messages</Text>
    </TouchableOpacity>
  ),
  headerStyle: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
  },
});

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
        options={(props) => ({ ...conversationHeader(props), title: "Message" })}
      />
      <Stack.Screen
        name="NewMessage"
        component={NewMessageScreen}
        options={(props) => ({
          ...conversationHeader(props),
          title: "New message",
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Platform.OS === "ios" ? 8 : 0,
  },
  backText: {
    fontSize: RFPercentage(2.1),
    color: colors.link,
  },
});
