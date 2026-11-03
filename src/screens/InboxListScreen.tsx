import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { InboxList } from "../../components";

export default function InboxListScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <InboxList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
