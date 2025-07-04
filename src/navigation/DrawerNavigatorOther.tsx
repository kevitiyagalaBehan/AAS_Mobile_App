import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomTabOther from "./BottomTabNavigatorOther";
import DetailsScreen from "../screens/DetailsScreen";
import CustomDrawerContent from "./CustomDrawerContent";
import { DrawerParamListOther } from "./types";
import { useAuth } from "../context/AuthContext";
import { useAutoLogout } from "../../hooks/useAutoLogout";
import { RFPercentage } from "react-native-responsive-fontsize";
import CashTransactionsScreen from "../screens/CashTransactionsScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import DocumentScreen from "../screens/DocumentScreen";

const Drawer = createDrawerNavigator<DrawerParamListOther>();

export default function DrawerNavigatorOther() {
  const { userData } = useAuth();

  useAutoLogout();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        options={{
          drawerLabel: "Home",
          //drawerItemStyle: { display: "none" },
          drawerIcon: ({ color }) => (
            <Ionicons name="home" size={30} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Details"
        component={DetailsScreen}
        initialParams={{
          authToken: userData?.authToken,
          accountId: userData?.accountId,
        }}
        options={{
          drawerLabel: "Details",
          drawerIcon: ({ color }) => (
            <Ionicons name="list-circle" size={30} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Transactions"
        component={CashTransactionsScreen}
        initialParams={{
          authToken: userData?.authToken,
          accountId: userData?.accountId,
        }}
        options={{
          drawerLabel: "Bank",
          drawerIcon: ({ color }) => (
            <Ionicons name="card" size={30} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Portfolio"
        component={PortfolioScreen}
        initialParams={{
          authToken: userData?.authToken,
          accountId: userData?.accountId,
        }}
        options={{
          drawerLabel: "Portfolio",
          drawerIcon: ({ color }) => (
            <Ionicons name="bag-check" size={30} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Document"
        component={DocumentScreen}
        initialParams={{
          authToken: userData?.authToken,
          accountId: userData?.accountId,
        }}
        options={{
          drawerLabel: "Documents",
          drawerIcon: ({ color }) => (
            <Ionicons name="documents" size={30} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
