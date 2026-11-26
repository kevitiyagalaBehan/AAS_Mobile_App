import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomTabFamily from "./BottomTabNavigatorFamily";
import CustomDrawerContent from "./CustomDrawerContent";
import InboxStackNavigator from "./InboxStackNavigator";
import { DrawerMenuItem, DrawerParamListFamily } from "./types";
import { useAuth } from "../context/AuthContext";
import { useAutoLogout } from "../../hooks/useAutoLogout";
import { RFPercentage } from "react-native-responsive-fontsize";

const Drawer = createDrawerNavigator<DrawerParamListFamily>();

// What an adviser sees after opening a Family Group account; clients have no menu items here
const ADVISER_MENU_ITEMS: DrawerMenuItem[] = [
  { label: "Signing requests", icon: "create", screen: "MainTabs", tab: "ESigning" },
  { label: "Message this client", icon: "mail", screen: "Inbox", tab: "NewMessage" },
];

export default function DrawerNavigatorFamily() {
  const { userData, viewingClient } = useAuth();

  useAutoLogout(!viewingClient);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          menuItems={viewingClient ? ADVISER_MENU_ITEMS : []}
        />
      )}
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
      <Drawer.Screen name="Inbox" component={InboxStackNavigator} />
    </Drawer.Navigator>
  );
}
