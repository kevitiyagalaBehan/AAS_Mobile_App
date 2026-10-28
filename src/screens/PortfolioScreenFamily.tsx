import React, { useState } from "react";
import {
  StyleSheet,
  RefreshControl,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  ScreenTitle,
  AllocationBreakdown,
  AssetAllocationFamily,
  AccountList,
  ConsolidatedAccounts,
  TopTenInvestmentsFamily,
} from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { usePortfolioSummary } from "../../hooks/usePortfolioSummaryFamily";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format";
import { colors } from "../theme/colors";

// Family groups have no per-holding or performance endpoints, so the tabs
// use the consolidated family APIs instead
const SEGMENTS = ["Accounts", "Allocation", "Top 10"] as const;
type Segment = (typeof SEGMENTS)[number];

export default function PortfolioScreenFamily() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();
  const { userData } = useAuth();
  const { authToken = "", accountId = "" } = userData ?? {};
  // Same source as the Home "Total balance" for family groups
  const { data, loading, error } = usePortfolioSummary(
    authToken,
    accountId,
    refreshTrigger
  );
  const [segment, setSegment] = useState<Segment>("Accounts");
  const styles = getStyles(width, height);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: height * 0.02 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle
            title="Portfolio"
            subtitle={
              data ? (
                <>
                  Market value{" "}
                  <Text style={styles.marketValue}>
                    {formatCurrency(data.totalMarketValue)}
                  </Text>
                </>
              ) : undefined
            }
          />

          <View style={styles.bodySection}>
            <View style={styles.segmentedControl}>
              {SEGMENTS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.segment, segment === item && styles.segmentActive]}
                  onPress={() => setSegment(item)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: segment === item }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      segment === item && styles.segmentTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {segment === "Accounts" && (
              <>
                <ConsolidatedAccounts
                  refreshTrigger={refreshTrigger}
                  refreshing={false}
                />
                <AccountList refreshTrigger={refreshTrigger} refreshing={false} />
              </>
            )}

            {segment === "Allocation" && (
              <>
                <AllocationBreakdown refreshTrigger={refreshTrigger} />
                <AssetAllocationFamily data={data} loading={loading} error={error} />
              </>
            )}

            {segment === "Top 10" && (
              <TopTenInvestmentsFamily
                refreshTrigger={refreshTrigger}
                refreshing={false}
              />
            )}
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
      paddingHorizontal: width * 0.03,
    },
    marketValue: {
      fontWeight: "bold",
      color: colors.primary,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: "#E2E6EE",
      borderRadius: 12,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
    },
    segmentActive: {
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    segmentText: {
      fontSize: RFPercentage(1.9),
      color: "#4B5563",
      fontWeight: "600",
    },
    segmentTextActive: {
      color: colors.primary,
      fontWeight: "bold",
    },
  });
