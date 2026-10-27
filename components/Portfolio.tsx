import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { getInvestments } from "../src/utils/pimsApi";
import {
  Investment,
  InvestmentsResponse,
  Props,
} from "../src/navigation/types";

const formatAmount = (value: number) =>
  value.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const sumBy = (items: Investment[], key: "marketValue" | "marketPercentage") =>
  items.reduce((sum, inv) => sum + inv[key], 0);

export default function InvestmentBreakdown({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [data, setData] = useState<InvestmentsResponse | null>(null);
  const [selectedItem, setSelectedItem] = useState<Investment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getInvestments(
          userData.authToken,
          userData.accountId,
        );
        setData(res);
      } catch (err) {
        setError("Failed to load investment details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (!data) {
    return <Text style={styles.errorText}>No portfolio data available</Text>;
  }

  const grouped = data.investments.reduce(
    (acc, inv) => {
      if (!acc[inv.assetCategory]) acc[inv.assetCategory] = {};
      if (!acc[inv.assetCategory][inv.assetClass])
        acc[inv.assetCategory][inv.assetClass] = [];
      acc[inv.assetCategory][inv.assetClass].push(inv);
      return acc;
    },
    {} as Record<string, Record<string, Investment[]>>,
  );

  const handleRowPress = (item: Investment) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const detailRows = selectedItem
    ? [
        { label: "Quantity", value: formatAmount(selectedItem.quantity) },
        { label: "Price ($)", value: formatAmount(selectedItem.price) },
        { label: "Cost ($)", value: formatAmount(selectedItem.bookCost) },
        {
          label: "Market value ($)",
          value: formatAmount(selectedItem.marketValue),
        },
        {
          label: "Portfolio weight (%)",
          value: selectedItem.marketPercentage.toFixed(2),
        },
        { label: "Est. income ($)", value: formatAmount(selectedItem.income) },
        { label: "Est. yield (%)", value: selectedItem.yield.toFixed(2) },
      ]
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.labelColumn]}>Holding</Text>
        <Text style={[styles.headerText, styles.valueColumn]}>Mkt ($)</Text>
        <Text style={[styles.headerText, styles.percentColumn]}>Mkt (%)</Text>
      </View>

      {Object.entries(grouped).map(([category, classes]) => {
        const categoryItems = Object.values(classes).flat();

        return (
          <React.Fragment key={category}>
            <View style={styles.categoryRow}>
              <Text style={[styles.categoryText, styles.labelColumn]}>
                {category.toUpperCase()}
              </Text>
              <Text style={[styles.categoryText, styles.valueColumn]}>
                {formatAmount(sumBy(categoryItems, "marketValue"))}
              </Text>
              <Text style={[styles.categoryText, styles.percentColumn]}>
                {sumBy(categoryItems, "marketPercentage").toFixed(2)}
              </Text>
            </View>

            {Object.entries(classes).map(([className, items]) => (
              <React.Fragment key={`${category}-${className}`}>
                <View style={styles.classRow}>
                  <Text
                    style={[styles.classText, styles.labelColumn]}
                    numberOfLines={1}
                  >
                    {className}
                  </Text>
                  <Text style={[styles.classText, styles.valueColumn]}>
                    {formatAmount(sumBy(items, "marketValue"))}
                  </Text>
                  <Text style={[styles.classText, styles.percentColumn]}>
                    {sumBy(items, "marketPercentage").toFixed(2)}
                  </Text>
                </View>

                {items.map((inv, idx) => (
                  <TouchableOpacity
                    key={`${inv.code}-${idx}`}
                    style={[
                      styles.dataRow,
                      idx === items.length - 1 && styles.lastDataRow,
                    ]}
                    onPress={() => handleRowPress(inv)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.labelColumn}>
                      <Text style={styles.codeText} numberOfLines={1}>
                        {inv.code}
                      </Text>
                      {!!inv.description && (
                        <Text style={styles.descriptionText} numberOfLines={1}>
                          {inv.description}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.dataText, styles.valueColumn]}>
                      {formatAmount(inv.marketValue)}
                    </Text>
                    <Text style={[styles.dataText, styles.percentColumn]}>
                      {inv.marketPercentage.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}

      <View style={styles.grandTotalRow}>
        <Text style={[styles.totalText, styles.labelColumn]}>Total</Text>
        <Text style={[styles.totalText, styles.valueColumn]}>
          {formatAmount(sumBy(data.investments, "marketValue"))}
        </Text>
        <Text style={[styles.totalText, styles.percentColumn]}>
          {sumBy(data.investments, "marketPercentage").toFixed(2)}
        </Text>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
                    onPress={() => setModalVisible(false)}
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
                  onPress={() => setModalVisible(false)}
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
    container: {
      backgroundColor: "#fff",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      overflow: "hidden",
      marginBottom: height * 0.01,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      textAlign: "center",
      marginTop: height * 0.3,
    },
    labelColumn: {
      flex: 1.3,
      paddingRight: width * 0.02,
    },
    valueColumn: {
      flex: 1.1,
      textAlign: "right",
    },
    percentColumn: {
      flex: 0.7,
      textAlign: "right",
    },
    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.012,
      paddingHorizontal: width * 0.03,
    },
    headerText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(1.8),
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#D6E5F3",
      paddingVertical: height * 0.01,
      paddingHorizontal: width * 0.03,
    },
    categoryText: {
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: "#0B1F44",
      letterSpacing: 0.3,
    },
    classRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F3F6F9",
      paddingVertical: height * 0.008,
      paddingHorizontal: width * 0.03,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    classText: {
      fontSize: RFPercentage(1.8),
      fontWeight: "600",
      color: "#374151",
    },
    dataRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: height * 0.01,
      paddingHorizontal: width * 0.03,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    lastDataRow: {
      borderBottomWidth: 0,
    },
    codeText: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: "#1B77BE",
    },
    descriptionText: {
      fontSize: RFPercentage(1.5),
      color: "#6B7280",
      marginTop: 2,
    },
    dataText: {
      fontSize: RFPercentage(1.9),
      color: "#111827",
    },
    grandTotalRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0B1F44",
      paddingVertical: height * 0.014,
      paddingHorizontal: width * 0.03,
    },
    totalText: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: "#fff",
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
      color: "#0B1F44",
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
      backgroundColor: "#0B1F44",
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
