import React, { useEffect, useState } from "react";
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
  Portfolio,
  ScreenTitle,
  AllocationBreakdown,
  AssetAllocationOther,
  InvestmentPerformance,
  PortfolioBalanceSummaryHome,
} from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { useAuth } from "../context/AuthContext";
import { getInvestments } from "../utils/pimsApi";
import { InvestmentsResponse } from "../navigation/types";
import { formatCurrency, getHoldingsTotal } from "../utils/format";
import { colors } from "../theme/colors";

const SEGMENTS = ["Holdings", "Allocation", "Performance"] as const;
type Segment = (typeof SEGMENTS)[number];

export default function PortfolioScreen() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();
  const { userData } = useAuth();
  const [segment, setSegment] = useState<Segment>("Holdings");
  const [holdings, setHoldings] = useState<InvestmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const styles = getStyles(width, height);

  useEffect(() => {
    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setHoldings(await getInvestments(userData.authToken, userData.accountId));
      } catch {
        setHoldings(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const marketValue = holdings ? getHoldingsTotal(holdings.investments) : null;

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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle
            title="Portfolio"
            subtitle={
              marketValue !== null ? (
                <>
                  Market value{" "}
                  <Text style={styles.marketValue}>
                    {formatCurrency(marketValue)}
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
                  style={[
                    styles.segment,
                    segment === item && styles.segmentActive,
                  ]}
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

            {segment === "Holdings" &&
              (loading ? (
                <Text style={styles.muted}>Loading...</Text>
              ) : holdings ? (
                <Portfolio data={holdings} />
              ) : (
                <Text style={styles.muted}>No portfolio data available</Text>
              ))}

            {segment === "Allocation" && (
              <>
                <AllocationBreakdown refreshTrigger={refreshTrigger} />
                <AssetAllocationOther
                  refreshTrigger={refreshTrigger}
                  refreshing={false}
                />
              </>
            )}

            {segment === "Performance" && (
              <>
                <InvestmentPerformance
                  refreshTrigger={refreshTrigger}
                  refreshing={false}
                />
                <PortfolioBalanceSummaryHome
                  refreshTrigger={refreshTrigger}
                  refreshing={false}
                />
              </>
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
    muted: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
      marginTop: height * 0.05,
    },
  });
