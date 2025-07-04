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
import { useAuth } from "../src/context/AuthContext";
import { getInvestments } from "../src/utils/pimsApi";
import {
  Investment,
  InvestmentsResponse,
  Props,
} from "../src/navigation/types";

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
          userData.accountId
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

  const grouped = data.investments.reduce((acc, inv) => {
    if (!acc[inv.assetCategory]) acc[inv.assetCategory] = {};
    if (!acc[inv.assetCategory][inv.assetClass])
      acc[inv.assetCategory][inv.assetClass] = [];
    acc[inv.assetCategory][inv.assetClass].push(inv);
    return acc;
  }, {} as Record<string, Record<string, Investment[]>>);

  const handleCodePress = (item: Investment) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Portfolio</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerText, { flex: 1 }]}>
              Code
            </Text>
            <Text style={[styles.cell, styles.headerText, styles.rightAlign]}>
              Mkt ($)
            </Text>
            <Text style={[styles.cell, styles.headerText, styles.rightAlign]}>
              Mkt (%)
            </Text>
          </View>

          {Object.entries(grouped).map(([category, classes], catIndex) => {
            const categoryMarketValue = Object.values(classes)
              .flat()
              .reduce((sum, inv) => sum + inv.marketValue, 0);
            const categoryMarketPercentage = Object.values(classes)
              .flat()
              .reduce((sum, inv) => sum + inv.marketPercentage, 0);

            return (
              <React.Fragment key={catIndex}>
                <View style={styles.categoryRow}>
                  <Text style={[styles.cell, styles.boldText, { flex: 1 }]}>
                    {category}
                  </Text>
                  <Text
                    style={[styles.cell, styles.rightAlign, styles.boldText]}
                  >
                    {categoryMarketValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text
                    style={[styles.cell, styles.rightAlign, styles.boldText]}
                  >
                    {categoryMarketPercentage.toFixed(2)}
                  </Text>
                </View>

                {Object.entries(classes).map(
                  ([className, items], classIndex) => {
                    const classMarketValue = items.reduce(
                      (sum, inv) => sum + inv.marketValue,
                      0
                    );
                    const classMarketPercentage = items.reduce(
                      (sum, inv) => sum + inv.marketPercentage,
                      0
                    );

                    return (
                      <React.Fragment key={classIndex}>
                        <View style={styles.classRow}>
                          <Text
                            style={[styles.cell, styles.boldText, { flex: 1 }]}
                          >
                            {className}
                          </Text>
                          <Text style={styles.cell}></Text>
                          <Text style={styles.cell}></Text>
                        </View>

                        {items.map((inv, idx) => (
                          <View key={idx} style={styles.dataRow}>
                            <TouchableOpacity
                              onPress={() => handleCodePress(inv)}
                              style={styles.cell}
                            >
                              <Text
                                style={{
                                  color: "#1B77BE",
                                  textDecorationLine: "underline",
                                }}
                              >
                                {inv.code}
                              </Text>
                            </TouchableOpacity>
                            <Text style={[styles.cell, styles.rightAlign]}>
                              {inv.marketValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <Text style={[styles.cell, styles.rightAlign]}>
                              {inv.marketPercentage.toFixed(2)}
                            </Text>
                          </View>
                        ))}

                        <View style={styles.subtotalRow}>
                          <Text
                            style={[styles.cell, styles.boldText, { flex: 1 }]}
                          ></Text>
                          <Text
                            style={[
                              styles.cell,
                              styles.rightAlign,
                              styles.boldText,
                            ]}
                          >
                            {classMarketValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                          <Text
                            style={[
                              styles.cell,
                              styles.rightAlign,
                              styles.boldText,
                            ]}
                          >
                            {classMarketPercentage.toFixed(2)}
                          </Text>
                        </View>
                      </React.Fragment>
                    );
                  }
                )}
              </React.Fragment>
            );
          })}
          <View style={styles.grandTotalRow}>
            <Text style={[styles.cell, styles.boldText, { flex: 1 }]}>
              Total
            </Text>
            <Text style={[styles.cell, styles.rightAlign, styles.boldText]}>
              {data.investments
                .reduce((sum, inv) => sum + inv.marketValue, 0)
                .toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </Text>
            <Text style={[styles.cell, styles.rightAlign, styles.boldText]}>
              {data.investments
                .reduce((sum, inv) => sum + inv.marketPercentage, 0)
                .toFixed(2)}
            </Text>
          </View>
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
                  <Text style={styles.modalTitle}>{selectedItem.code}</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Description:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.description}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Quantity:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.quantity.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Cost ($):</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.bookCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Price ($):</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.bookCost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Mkt ($):</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.marketValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Mkt (%):</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.marketPercentage.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Yld ($):</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.income.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Yld (%):</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.yield.toFixed(2)}
                    </Text>
                  </View>
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
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      //flex: 1,
      backgroundColor: "#fff",
      //marginBottom: height * 0.01,
      marginTop: height * 0.02,
      borderRadius: 6,
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      paddingHorizontal: width * 0.02,
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
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.6),
    },
    tableContainer: {
      marginBottom: height * 0.01,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#1B77BE",
    },
    headerText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(1.8),
    },
    categoryRow: {
      flexDirection: "row",
      backgroundColor: "#D6E5F3",
    },
    classRow: {
      flexDirection: "row",
      backgroundColor: "#F0F4F7",
    },
    dataRow: {
      flexDirection: "row",
    },
    grandTotalRow: {
      flexDirection: "row",
      //backgroundColor: "#1B77BE",
      borderTopWidth: 1,
      borderColor: "#000",
    },
    subtotalRow: {
      flexDirection: "row",
    },
    cell: {
      flex: 1,
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      fontSize: RFPercentage(2),
    },
    rightAlign: {
      textAlign: "right",
    },
    boldText: {
      fontWeight: "bold",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      width: width * 0.8,
      backgroundColor: "white",
      borderRadius: 10,
      padding: width * 0.05,
    },
    modalTitle: {
      fontSize: RFPercentage(2.5),
      fontWeight: "bold",
      color: "#4A90E2",
      marginBottom: height * 0.02,
      textAlign: "center",
    },
    modalRow: {
      flexDirection: "row",
      marginBottom: height * 0.015,
    },
    modalLabel: {
      fontWeight: "bold",
      width: width * 0.3,
      fontSize: RFPercentage(2),
    },
    modalText: {
      flex: 1,
      fontSize: RFPercentage(2),
    },
    closeButton: {
      marginTop: height * 0.02,
      backgroundColor: "#00205A",
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
