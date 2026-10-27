import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ESigning, ScreenTitle } from "../../components";

export default function ESigningScreen() {
  const { width } = useWindowDimensions();
  const styles = getStyles(width);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScreenTitle title="Signing" />
        <View style={styles.bodySection}>
          <ESigning />
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
