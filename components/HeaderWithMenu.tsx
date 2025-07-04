import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import React, { useEffect } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getSuperFundName } from "../src/utils/pimsApi";
import Drawer from "./Drawer";

export default function HeaderWithMenu() {
  const { userData, currentAccountName, setCurrentAccountName } = useAuth();

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setCurrentAccountName(null);
        return;
      }
      const accountDetails = await getSuperFundName(
        userData.authToken,
        userData.accountId
      );

      if (accountDetails && accountDetails.length > 0) {
        setCurrentAccountName(accountDetails[0].superFundName);
      } else {
        setCurrentAccountName("User not found");
      }
    };

    fetchUserData();
  }, [userData?.authToken, userData?.accountId]);

  const styles = getStyles(width, height);

  if (!userData?.authToken || !userData?.accountId) return null;

  return (
    <View style={styles.headerSection}>
      <Drawer />
      <Text style={styles.accountNameText}>
        {currentAccountName || "Loading user..."}
      </Text>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    headerSection: {
      backgroundColor: "#fff",
      paddingHorizontal: width * 0.04,
      paddingTop: height * 0.02,
      paddingBottom: height * 0.015,
    },
    accountNameText: {
      fontSize: RFPercentage(2.7),
      fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: height * 0.01,
    },
  });
