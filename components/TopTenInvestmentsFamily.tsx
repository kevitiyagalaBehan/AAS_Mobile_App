import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { getTopTenInvestmentDetailsFamily } from "../src/utils/pimsApi";
import { TopTenInvestmentDetailsFamily, Props } from "../src/navigation/types";
import { formatCurrency } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";

// Laid out like the Portfolio > Holdings rows
export default function TopTenInvestmentsFamily({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [investments, setInvestments] = useState<
    TopTenInvestmentDetailsFamily[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<TopTenInvestmentDetailsFamily | null>(null);
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getTopTenInvestmentDetailsFamily(
          userData.authToken,
          userData.accountId
        );
        setInvestments(data);
      } catch (err) {
        setError("Failed to load investment details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const sorted = [...(investments ?? [])].sort(
    (a, b) => b.marketValue - a.marketValue
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Top 10 investments</Text>
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : error ? (
        <Text style={styles.muted}>{error}</Text>
      ) : sorted.length === 0 ? (
        <Text style={styles.muted}>No investments data available</Text>
      ) : (
        sorted.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, index === sorted.length - 1 && styles.lastRow]}
            onPress={() => setSelectedItem(item)}
            activeOpacity={0.6}
          >
            <View style={styles.rank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.main}>
              <View style={styles.topLine}>
                <Text style={styles.code} numberOfLines={1}>
                  {item.code}
                </Text>
                <Text style={styles.value}>{formatCurrency(item.marketValue)}</Text>
              </View>
              {!!item.owner && (
                <Text style={styles.owner} numberOfLines={1}>
                  {item.owner}
                </Text>
              )}
              <View style={styles.weightTrack}>
                <View
                  style={[
                    styles.weightFill,
                    {
                      width: `${Math.min(Math.max(item.marketPercentage, 0), 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.weightText}>
                {item.marketPercentage.toFixed(2)}%
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedItem}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedItem.code}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    hitSlop={10}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {[
                  { label: "Owner", value: selectedItem.owner || "N/A" },
                  {
                    label: "Market value",
                    value: formatCurrency(selectedItem.marketValue),
                  },
                  {
                    label: "Portfolio weight",
                    value: `${selectedItem.marketPercentage.toFixed(2)}%`,
                  },
                ].map((row, idx, rows) => (
                  <View
                    key={row.label}
                    style={[
                      styles.modalRow,
                      idx === rows.length - 1 && styles.lastRow,
                    ]}
                  >
                    <Text style={styles.modalLabel}>{row.label}</Text>
                    <Text style={styles.modalValue}>{row.value}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    card: {
      paddingHorizontal: 0,
      paddingVertical: 4,
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
    lastRow: {
      borderBottomWidth: 0,
    },
    rank: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    rankText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "bold",
      color: colors.primary,
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
    code: {
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
    owner: {
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
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      width: width * 0.85,
      backgroundColor: "white",
      borderRadius: 12,
      padding: width * 0.05,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: height * 0.015,
    },
    modalTitle: {
      flex: 1,
      fontSize: RFPercentage(2.6),
      fontWeight: "bold",
      color: colors.primary,
    },
    modalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: height * 0.01,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    modalLabel: {
      fontSize: RFPercentage(1.9),
      color: "#6B7280",
    },
    modalValue: {
      flexShrink: 1,
      textAlign: "right",
      marginLeft: 12,
      fontSize: RFPercentage(1.9),
      fontWeight: "600",
      color: "#111827",
    },
    closeButton: {
      marginTop: height * 0.02,
      backgroundColor: colors.primary,
      padding: width * 0.03,
      borderRadius: 10,
      alignItems: "center",
    },
    closeButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
  });
