import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import HomeScreenFamily from "../screens/HomeScreenFamily";
import PortfolioScreenFamily from "../screens/PortfolioScreenFamily";
import { colors } from "../theme/colors";
import ESigningScreen from "../screens/ESigningScreen";
import { BottomTabParamListFamily } from "./types";
import { RFPercentage } from "react-native-responsive-fontsize";
import InboxStackNavigator from "./InboxStackNavigator";
import { useWindowDimensions, View, Text } from "react-native";
import { useESign } from "../context/ESignContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator<BottomTabParamListFamily>();

export default function BottomTabFamily() {
  const { toBeSignedCount } = useESign();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarStyle = {
    height: height * 0.075 + insets.bottom,
    paddingTop: height * 0.01,
    paddingBottom: insets.bottom,
  };

  return (
    <Tab.Navigator
      initialRouteName="HomeFamily"
      screenOptions={{
        tabBarStyle,
        tabBarActiveTintColor: colors.link,
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
        name="Portfolio"
        component={PortfolioScreenFamily}
        options={{
          headerShown: false,
          tabBarLabel: "Portfolio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxStackNavigator}
        options={({ route }) => ({
          headerShown: false,
          tabBarLabel: "Messages",
          // Hide the bar inside a chat, as for client accounts
          tabBarStyle:
            getFocusedRouteNameFromRoute(route) === "InboxDetail"
              ? { display: "none" }
              : tabBarStyle,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-ellipses" size={size} color={color} />
          ),
        })}
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
    </Tab.Navigator>
  );
}
