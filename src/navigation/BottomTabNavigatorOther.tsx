import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import HomeScreenOther from "../screens/HomeScreenOther";
import ESigningScreen from "../screens/ESigningScreen";
import { BottomTabParamListOther } from "./types";
import { RFPercentage } from "react-native-responsive-fontsize";
import InboxStackNavigator from "./InboxStackNavigator";
import { useWindowDimensions, View, Text } from "react-native";
import { useESign } from "../context/ESignContext";

const Tab = createBottomTabNavigator<BottomTabParamListOther>();

export default function BottomTabOther() {
  const navigation = useNavigation();
  const { toBeSignedCount } = useESign();
  const { width, height } = useWindowDimensions();

  return (
    <Tab.Navigator
      initialRouteName="HomeOther"
      screenOptions={{
        tabBarStyle: { height: height * 0.075, paddingTop: height * 0.01 },
        tabBarLabelStyle: { fontSize: RFPercentage(1.4), fontWeight: "bold" },
      }}
    >
      <Tab.Screen
        name="HomeOther"
        component={HomeScreenOther}
        options={{
          headerShown: false,
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "InboxList";

          return {
            headerShown: false,
            tabBarLabel: "Inbox",
            tabBarStyle:
              routeName === "InboxDetail"
                ? { display: "none" }
                : { height: height * 0.08 },
            tabBarLabelStyle: {
              fontSize: RFPercentage(1.4),
              fontWeight: "bold",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbox-ellipses" size={size} color={color} />
            ),
          };
        }}
      />
      <Tab.Screen
        name="ESigning"
        component={ESigningScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Signing",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="create" size={size} color={color} />
              {toBeSignedCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -10,
                    top: -5,
                    backgroundColor: "red",
                    borderRadius: 10,
                    minWidth: 16,
                    height: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
                  >
                    {toBeSignedCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={HomeScreenOther}
        options={{
          tabBarLabel: "Menu",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(DrawerActions.openDrawer());
          },
        }}
      />
    </Tab.Navigator>
  );
}
