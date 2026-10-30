import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import BottomTabOther from "./BottomTabNavigatorOther";
import CustomDrawerContent from "./CustomDrawerContent";
import DetailsScreen from "../screens/DetailsScreen";
import PersonalDetailsScreen from "../screens/PersonalDetailsScreen";
import CashTransactionsScreen from "../screens/CashTransactionsScreen";
import InboxStackNavigator from "./InboxStackNavigator";
import { DrawerParamListOther, DrawerMenuItem } from "./types";
import { useAuth } from "../context/AuthContext";
import { useAutoLogout } from "../../hooks/useAutoLogout";
import { RFPercentage } from "react-native-responsive-fontsize";

const Drawer = createDrawerNavigator<DrawerParamListOther>();

const MENU_ITEMS: DrawerMenuItem[] = [
  { label: "Personal details", icon: "person-circle", screen: "PersonalDetails" },
  { label: "Details", icon: "list-circle", screen: "Details" },
  { label: "Bank account", icon: "card", screen: "Transactions" },
  { label: "Documents", icon: "documents", screen: "MainTabs", tab: "Documents" },
];

export default function DrawerNavigatorOther() {
  const { userData } = useAuth();

  useAutoLogout();

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} menuItems={MENU_ITEMS} />
      )}
      screenOptions={{
        //drawerType: "back",
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
        component={BottomTabOther}
        initialParams={{
          authToken: userData?.authToken,
          accountId: userData?.accountId,
        }}
      />
      <Drawer.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Drawer.Screen name="Details" component={DetailsScreen} />
      <Drawer.Screen name="Transactions" component={CashTransactionsScreen} />
      <Drawer.Screen name="Inbox" component={InboxStackNavigator} />
    </Drawer.Navigator>
  );
}
