import React from "react";
import { StyleSheet, View, Text, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ESigning } from "../../components";
import { RFPercentage } from "react-native-responsive-fontsize";

export default function ESigningScreen() {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Signing</Text>
        </View>
        <View style={styles.bodySection}>
          <ESigning />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      height: height * 0.08,
      justifyContent: "center",
      paddingHorizontal: width * 0.04,
      backgroundColor: "#fff",
    },
    headerText: {
      fontSize: RFPercentage(2.6),
      fontWeight: "bold",
      color: "#1B77BE",
    },
    bodySection: {
      flex: 1,
      paddingHorizontal: width * 0.02,
    },
  });
