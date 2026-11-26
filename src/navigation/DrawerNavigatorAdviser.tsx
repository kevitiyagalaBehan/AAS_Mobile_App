import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { RFPercentage } from "react-native-responsive-fontsize";
import BottomTabAdviser from "./BottomTabNavigatorAdviser";
import CustomDrawerContent from "./CustomDrawerContent";
import { AdviserBadgeProvider } from "../context/AdviserBadgeContext";
import { useAutoLogout } from "../../hooks/useAutoLogout";
import { useClientView } from "../../hooks/useClientView";
import { DrawerParamListAdviser } from "./types";

const Drawer = createDrawerNavigator<DrawerParamListAdviser>();

// The adviser menu only has the account settings (PIN, password, log out) for now
export default function DrawerNavigatorAdviser() {
  const { clearClient } = useClientView();

  useAutoLogout();

  // Back from a client account, so forget which client was open
  useFocusEffect(clearClient);

  return (
    <AdviserBadgeProvider>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} menuItems={[]} />}
        screenOptions={{
          drawerPosition: "right",
          headerShown: false,
          drawerStyle: { width: "75%" },
          drawerLabelStyle: { fontSize: RFPercentage(2) },
        }}
      >
        <Drawer.Screen name="MainTabs" component={BottomTabAdviser} />
      </Drawer.Navigator>
    </AdviserBadgeProvider>
  );
}
