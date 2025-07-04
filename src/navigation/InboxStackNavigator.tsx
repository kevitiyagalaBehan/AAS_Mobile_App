import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import InboxList from "../screens/InboxListScreen";
import { InboxStackParamList } from "./types";
import InboxDetail from "../screens/InboxDetailScreen";
import { RFPercentage } from "react-native-responsive-fontsize";

const Stack = createStackNavigator<InboxStackParamList>();

export default function InboxStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        //headerShown: true,
        headerTitleStyle: {
          fontSize: RFPercentage(2.6),
          color: "#1B77BE",
          fontWeight: "bold",
        },
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
          headerTitleAlign: "center",
          headerStyle: {
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      />
    </Stack.Navigator>
  );
}
