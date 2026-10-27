import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import BottomTabOther from "./BottomTabNavigatorOther";
import CustomDrawerContent from "./CustomDrawerContent";
import DetailsScreen from "../screens/DetailsScreen";
import CashTransactionsScreen from "../screens/CashTransactionsScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import { DrawerParamListOther, DrawerMenuItem } from "./types";
import { useAuth } from "../context/AuthContext";
import { useAutoLogout } from "../../hooks/useAutoLogout";
import { RFPercentage } from "react-native-responsive-fontsize";

const Drawer = createDrawerNavigator<DrawerParamListOther>();

const MENU_ITEMS: DrawerMenuItem[] = [
  { label: "Details", icon: "list-circle", screen: "Details" },
  { label: "Bank", icon: "card", screen: "Transactions" },
  { label: "Portfolio", icon: "bag-check", screen: "Portfolio" },
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
      <Drawer.Screen name="Details" component={DetailsScreen} />
      <Drawer.Screen name="Transactions" component={CashTransactionsScreen} />
      <Drawer.Screen name="Portfolio" component={PortfolioScreen} />
    </Drawer.Navigator>
  );
}
