import React from "react";
import {
  StyleSheet,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { HeaderWithMenu, Portfolio } from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";

export default function PortfolioScreen() {
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
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: height * 0.01,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bodySection}>
            <Portfolio
              refreshTrigger={refreshTrigger}
              refreshing={refreshing}
            />
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
