import React from "react";
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import {
  PortfolioSummary,
  AssetAllocationOther,
  Header,
  PortfolioBalanceSummaryHome,
  ContributionCapSummary,
  PensionLimitSummary,
  EstimatedMemberStatement,
  TopTenInvestments,
  InvestmentPerformance,
} from "../../components";

export default function HomeScreenOther() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();
  const styles = getStyles(width, height);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
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
          <View style={styles.bodySection}>
            <PortfolioSummary
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <AssetAllocationOther
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <PortfolioBalanceSummaryHome
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <TopTenInvestments
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <InvestmentPerformance
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <ContributionCapSummary
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <PensionLimitSummary
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
            <EstimatedMemberStatement
              refreshTrigger={refreshTrigger}
              refreshing={false}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#eee",
    },
    bodySection: {
      paddingHorizontal: width * 0.02,
    },
  });
