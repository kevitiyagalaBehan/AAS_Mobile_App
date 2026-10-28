import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { getConsolidateData } from "../src/utils/pimsApi";
import { ConsolidateData, Props } from "../src/navigation/types";
import { formatCurrency } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";
import DetailModal from "./DetailModal";

// Each account in the family group with its share of the total, laid out like
// the Portfolio > Holdings rows
export default function ConsolidatedAccounts({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const [accounts, setAccounts] = useState<ConsolidateData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ConsolidateData | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getConsolidateData(
          userData.authToken,
          userData.accountId
        );
        setAccounts(data);
      } catch (err) {
        setError("Failed to load account details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const sorted = [...(accounts ?? [])].sort(
    (a, b) => b.portfolioValue - a.portfolioValue
  );
  const totalValue = sorted.reduce((sum, item) => sum + item.portfolioValue, 0);
  const totalPercentage = sorted.reduce(
    (sum, item) => sum + item.portfolioPercentage,
    0
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Consolidated accounts</Text>
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : error ? (
        <Text style={styles.muted}>{error}</Text>
      ) : sorted.length === 0 ? (
        <Text style={styles.muted}>No consolidated data available</Text>
      ) : (
        <>
          {sorted.map((item) => (
            <TouchableOpacity
              key={item.clientId || item.clientCode}
              style={styles.row}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.6}
            >
              <View style={styles.main}>
                <View style={styles.topLine}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.clientName || item.clientCode}
                  </Text>
                  <Text style={styles.value}>
                    {formatCurrency(item.portfolioValue)}
                  </Text>
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.clientCode, item.entityType].filter(Boolean).join(" · ")}
                </Text>
                <View style={styles.weightTrack}>
                  <View
                    style={[
                      styles.weightFill,
                      {
                        width: `${Math.min(Math.max(item.portfolioPercentage, 0), 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weightText}>
                  {item.portfolioPercentage.toFixed(2)}%
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
            <Text style={styles.totalPercent}>{totalPercentage.toFixed(2)}%</Text>
          </View>
        </>
      )}

      <DetailModal
        visible={!!selectedItem}
        title={selectedItem?.clientName || selectedItem?.clientCode || ""}
        subtitle={selectedItem?.clientCode}
        rows={
          selectedItem
            ? [
                { label: "Entity type", value: selectedItem.entityType },
                {
                  label: "Market value",
                  value: formatCurrency(selectedItem.portfolioValue),
                },
                {
                  label: "Share of total",
                  value: `${selectedItem.portfolioPercentage.toFixed(2)}%`,
                },
              ]
            : []
        }
        onClose={() => setSelectedItem(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    color: colors.primary,
  },
  muted: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: RFPercentage(1.9),
    paddingVertical: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  main: {
    flex: 1,
    marginRight: 12,
  },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    flexShrink: 1,
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 8,
  },
  value: {
    fontSize: RFPercentage(2),
    fontWeight: "600",
    color: "#111827",
  },
  meta: {
    fontSize: RFPercentage(1.6),
    color: "#6B7280",
    marginTop: 2,
  },
  weightTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 8,
    width: "80%",
  },
  weightFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  weightText: {
    alignSelf: "flex-end",
    fontSize: RFPercentage(1.6),
    color: "#6B7280",
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: -4,
  },
  totalLabel: {
    flex: 1,
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  totalValue: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 12,
  },
  totalPercent: {
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    color: colors.primary,
  },
});
