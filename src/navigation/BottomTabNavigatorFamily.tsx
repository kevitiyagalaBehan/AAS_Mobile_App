import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import HomeScreenFamily from "../screens/HomeScreenFamily";
import ESigningScreen from "../screens/ESigningScreen";
import { BottomTabParamListFamily } from "./types";
import { RFPercentage } from "react-native-responsive-fontsize";
import InboxStackNavigator from "./InboxStackNavigator";
import { useWindowDimensions, View, Text } from "react-native";
import { useESign } from "../context/ESignContext";

const Tab = createBottomTabNavigator<BottomTabParamListFamily>();

export default function BottomTabFamily() {
  const navigation = useNavigation();
  const { toBeSignedCount } = useESign();
  const { width, height } = useWindowDimensions();

  return (
    <Tab.Navigator
      initialRouteName="HomeFamily"
      screenOptions={{
        tabBarStyle: { height: height * 0.075, paddingTop: height * 0.01 },
        tabBarLabelStyle: { fontSize: RFPercentage(1.4), fontWeight: "bold" },
      }}
    >
      <Tab.Screen
        name="HomeFamily"
        component={HomeScreenFamily}
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
        options={{
          headerShown: false,
          tabBarLabel: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-ellipses" size={size} color={color} />
          ),
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
        component={HomeScreenFamily}
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
