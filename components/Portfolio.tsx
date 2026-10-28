import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { Investment, InvestmentsResponse } from "../src/navigation/types";
import { getColorForAssetClass } from "../src/utils/assetColors";
import { formatCurrency } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";

const formatAmount = (value: number) =>
  value.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type HoldingsProps = {
  data: InvestmentsResponse;
};

// Holdings grouped by asset class, with search and a details popup
export default function Holdings({ data }: HoldingsProps) {
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Investment | null>(null);
  const styles = getStyles(width, height);

  const search = query.trim().toLowerCase();
  const filtered = search
    ? data.investments.filter(
        (inv) =>
          inv.code.toLowerCase().includes(search) ||
          inv.description?.toLowerCase().includes(search)
      )
    : data.investments;

  // Keep the API's order of asset classes
  const groups = filtered.reduce((acc, inv) => {
    const group = acc.find((g) => g.assetClass === inv.assetClass);
    if (group) group.items.push(inv);
    else acc.push({ assetClass: inv.assetClass, items: [inv] });
    return acc;
  }, [] as { assetClass: string; items: Investment[] }[]);

  // Respect the adviser's settings for which columns clients can see
  const { settings } = data;
  const detailRows = selectedItem
    ? [
        { label: "Quantity", value: formatAmount(selectedItem.quantity) },
        { label: "Price ($)", value: formatAmount(selectedItem.price) },
        settings?.column_BookCost !== false && {
          label: "Cost ($)",
          value: formatAmount(selectedItem.bookCost),
        },
        { label: "Market value ($)", value: formatAmount(selectedItem.marketValue) },
        {
          label: "Portfolio weight (%)",
          value: selectedItem.marketPercentage.toFixed(2),
        },
        settings?.column_EstIncome !== false && {
          label: "Est. income ($)",
          value: formatAmount(selectedItem.income),
        },
        settings?.column_EstYield !== false && {
          label: "Est. yield (%)",
          value: selectedItem.yield.toFixed(2),
        },
      ].filter((row): row is { label: string; value: string } => !!row)
    : [];

  return (
    <View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search holdings"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="characters"
          clearButtonMode="while-editing"
        />
      </View>

      {groups.length === 0 && (
        <Text style={styles.emptyText}>
          {search ? "No holdings match your search" : "No holdings available"}
        </Text>
      )}

      {groups.map(({ assetClass, items }) => {
        const classColor = getColorForAssetClass(assetClass);
        const classValue = items.reduce((sum, inv) => sum + inv.marketValue, 0);
        const classPercent = items.reduce(
          (sum, inv) => sum + inv.marketPercentage,
          0
        );

        return (
          <Card key={assetClass} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={[styles.dot, { backgroundColor: classColor }]} />
              <Text style={styles.groupName} numberOfLines={1}>
                {assetClass}
              </Text>
              <Text style={styles.groupValue}>{formatCurrency(classValue)}</Text>
              <Text style={styles.groupPercent}>{classPercent.toFixed(2)}%</Text>
            </View>

            {items.map((inv, idx) => (
              <TouchableOpacity
                key={`${inv.code}-${idx}`}
                style={styles.holdingRow}
                onPress={() => setSelectedItem(inv)}
                activeOpacity={0.6}
              >
                <View style={styles.holdingMain}>
                  <View style={styles.holdingTopLine}>
                    <Text style={styles.code} numberOfLines={1}>
                      {inv.code}
                    </Text>
                    <Text style={styles.value}>
                      {formatCurrency(inv.marketValue)}
                    </Text>
                  </View>
                  <View style={styles.weightTrack}>
                    <View
                      style={[
                        styles.weightFill,
                        {
                          width: `${Math.min(Math.max(inv.marketPercentage, 0), 100)}%`,
                          backgroundColor: classColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.weightText}>
                    {inv.marketPercentage.toFixed(2)}%
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </Card>
        );
      })}

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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedItem.code}</Text>
                    {!!selectedItem.description && (
                      <Text style={styles.modalSubtitle}>
                        {selectedItem.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    hitSlop={10}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {detailRows.map((row, idx) => (
                  <View
                    key={row.label}
                    style={[
                      styles.modalRow,
                      idx === detailRows.length - 1 && styles.modalLastRow,
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
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      paddingHorizontal: 14,
      marginTop: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      marginLeft: 8,
      fontSize: RFPercentage(2),
      color: "#111827",
    },
    emptyText: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
      marginTop: height * 0.05,
    },
    groupCard: {
      paddingVertical: 4,
      paddingHorizontal: 0,
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 3,
      marginRight: 10,
    },
    groupName: {
      flex: 1,
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: colors.primary,
    },
    groupValue: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      marginRight: 10,
    },
    groupPercent: {
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: colors.primary,
    },
    holdingRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    holdingMain: {
      flex: 1,
      marginRight: 12,
    },
    holdingTopLine: {
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
      marginBottom: height * 0.015,
    },
    modalTitle: {
      fontSize: RFPercentage(2.6),
      fontWeight: "bold",
      color: colors.primary,
    },
    modalSubtitle: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      marginTop: 2,
    },
    modalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: height * 0.01,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    modalLastRow: {
      borderBottomWidth: 0,
    },
    modalLabel: {
      fontSize: RFPercentage(1.9),
      color: "#6B7280",
    },
    modalValue: {
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
