import React from "react";
import { StyleSheet, View, Text, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

// Stand-in for adviser tabs that haven't been built yet (Accounts, Jobs, Queries, Inbox)
export default function AdviserComingSoonScreen({ route }: { route: { name: string } }) {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);
  const title = TITLES[route.name] ?? "Coming soon";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>
        <Ionicons name="construct-outline" size={40} color="#9CA3AF" />
        <Text style={styles.message}>This section is coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const TITLES: Record<string, string> = {
  AdviserAccounts: "Accounts",
  AdviserJobs: "AAS jobs",
  AdviserQueries: "Queries",
  AdviserInbox: "Inbox",
};

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#eee",
      paddingHorizontal: width * 0.04,
    },
    title: {
      fontSize: RFPercentage(3.6),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: height * 0.025,
    },
    body: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
    },
    message: {
      fontSize: RFPercentage(2),
      color: "#6B7280",
    },
  });
