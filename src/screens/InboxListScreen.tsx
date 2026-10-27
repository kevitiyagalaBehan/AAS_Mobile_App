import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { InboxList, ScreenTitle } from "../../components";

export default function InboxListScreen() {
  const { width } = useWindowDimensions();
  const styles = getStyles(width);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScreenTitle title="Inbox" />
        <View style={styles.bodySection}>
          <InboxList />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = (width: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    bodySection: {
      flex: 1,
      paddingHorizontal: width * 0.02,
    },
  });
