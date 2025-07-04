import React from "react";
import {
  StyleSheet,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Details, HeaderWithMenu } from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";

export default function TopTenInvestmentsScreen() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();

  const styles = getStyles(width);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <HeaderWithMenu />
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.bodySection}>
            <Details refreshTrigger={refreshTrigger} refreshing={refreshing} />
          </View>
        </ScrollView>
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
      paddingHorizontal: width * 0.02,
    },
  });
