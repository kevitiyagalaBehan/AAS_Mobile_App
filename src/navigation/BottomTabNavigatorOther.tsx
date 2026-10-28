import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import HomeScreenOther from "../screens/HomeScreenOther";
import ESigningScreen from "../screens/ESigningScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import SuperScreen from "../screens/SuperScreen";
import { BottomTabParamListOther } from "./types";
import { RFPercentage } from "react-native-responsive-fontsize";
import InboxStackNavigator from "./InboxStackNavigator";
import { useWindowDimensions, View, Text } from "react-native";
import { useESign } from "../context/ESignContext";
import { useHasSuperData } from "../../hooks/useHasSuperData";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator<BottomTabParamListOther>();

export default function BottomTabOther() {
  const { toBeSignedCount } = useESign();
  const hasSuper = useHasSuperData();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarStyle = {
    height: height * 0.075 + insets.bottom,
    paddingTop: height * 0.008,
    paddingBottom: insets.bottom,
  };

  return (
    <Tab.Navigator
      initialRouteName="HomeOther"
      screenOptions={{
        tabBarStyle,
        tabBarActiveTintColor: colors.link,
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
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Portfolio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      {/* Only for accounts with super/pension members; Family Group accounts use BottomTabFamily */}
      {hasSuper && (
        <Tab.Screen
          name="Super"
          component={SuperScreen}
          options={{
            headerShown: false,
            tabBarLabel: "Super",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Inbox"
        component={InboxStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "InboxList";

          return {
            headerShown: false,
            tabBarLabel: "Messages",
            tabBarStyle:
              routeName === "InboxDetail"
                ? { display: "none" }
                : tabBarStyle,
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
    </Tab.Navigator>
  );
}
