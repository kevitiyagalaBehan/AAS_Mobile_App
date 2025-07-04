import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomTabFamily from "./BottomTabNavigatorFamily";
import CustomDrawerContent from "./CustomDrawerContent";
import { DrawerParamListFamily } from "./types";
import { useAuth } from "../context/AuthContext";
import { useAutoLogout } from "../../hooks/useAutoLogout";
import { RFPercentage } from "react-native-responsive-fontsize";

const Drawer = createDrawerNavigator<DrawerParamListFamily>();

export default function DrawerNavigatorFamily() {
  const { userData } = useAuth();

  useAutoLogout();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: "right",
        headerShown: false,
        drawerStyle: { width: "75%" },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: -3,
          marginVertical: 4,
        },
        drawerLabelStyle: {
          fontSize: RFPercentage(2),
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabFamily}
        initialParams={{
          authToken: userData?.authToken,
          accountId: userData?.accountId,
        }}
        options={{
          drawerLabel: "Home",
          drawerIcon: ({ color }) => (
            <Ionicons name="home" size={30} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
