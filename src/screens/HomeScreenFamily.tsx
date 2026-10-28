import React from "react";
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import {
  Header,
  HomeMessageCard,
  AllocationBreakdown,
} from "../../components";

export default function HomeScreenFamily() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();
  const navigation = useNavigation<any>();
  const styles = getStyles(width);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: height * 0.02,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Header refreshTrigger={refreshTrigger} />
          <View style={styles.bodySection}>
            <HomeMessageCard refreshTrigger={refreshTrigger} />
            <AllocationBreakdown
              refreshTrigger={refreshTrigger}
              onSeeHoldings={() => navigation.navigate("Portfolio")}
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
      backgroundColor: "#eee",
    },
    bodySection: {
      paddingHorizontal: width * 0.02,
    },
  });
