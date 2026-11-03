import React from "react";
import {
  StyleSheet,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Details, ScreenTitle } from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";

export default function DetailsScreen() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();
  const styles = getStyles(width);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: height * 0.03 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle title="Details" showBack />
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
      backgroundColor: "#eee",
    },
    bodySection: {
      paddingHorizontal: width * 0.03,
    },
  });
