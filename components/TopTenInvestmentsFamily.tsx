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
import { useAuth } from "../src/context/AuthContext";
import { getTopTenInvestmentDetailsFamily } from "../src/utils/pimsApi";
import { TopTenInvestmentDetailsFamily, Props } from "../src/navigation/types";

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
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
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

  const handleCodePress = (item: TopTenInvestmentDetailsFamily) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!investments || investments.length === 0) {
    return <Text style={styles.errorText}>No investments data available</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Top Ten Investments</Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell1, { flex: 1 }]}>Code</Text>
            <Text style={[styles.headerCell2, { flex: 1 }]}>Value $</Text>
            <Text style={[styles.headerCell2, { flex: 1 }]}>%</Text>
          </View>

          {investments?.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.dataRow,
                { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleCodePress(item)}
                style={{ flex: 1 }}
              >
                <Text
                  style={[
                    styles.dataCell,
                    styles.leftAlign,
                    styles.underlineText,
                  ]}
                  numberOfLines={1}
                >
                  {item.code}
                </Text>
              </TouchableOpacity>
              <Text
                style={[styles.dataCell, styles.rightAlign, { flex: 1 }]}
                numberOfLines={1}
              >
                {item.marketValue.toLocaleString()}
              </Text>
              <Text
                style={[styles.dataCell, styles.rightAlign, { flex: 1 }]}
                numberOfLines={1}
              >
                {item.marketPercentage.toFixed(2)}
              </Text>
            </View>
          ))}
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
                    <Text style={styles.modalLabel}>Owner:</Text>
                    <Text style={styles.modalText}>{selectedItem.owner}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Value:</Text>
                    <Text style={styles.modalText}>
                      ${selectedItem.marketValue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Percentage:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.marketPercentage.toFixed(2)}%
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
      flex: 1,
      marginTop: height * 0.01,
      borderRadius: 6,
      backgroundColor: "#fff",
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      paddingHorizontal: width * 0.02,
    },
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.6),
    },
    tableContainer: {
      paddingBottom: height * 0.01,
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
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      marginBottom: height * 0.001,
    },
    headerCell1: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
      textAlign: "left",
    },
    headerCell2: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
      textAlign: "right",
    },
    dataRow: {
      flexDirection: "row",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      borderWidth: 1,
      borderColor: "#ccc",
      alignItems: "center",
    },
    dataCell: {
      fontSize: RFPercentage(2),
      color: "#333",
    },
    underlineText: {
      textDecorationLine: "underline",
      color: "#4A90E2",
    },
    leftAlign: {
      textAlign: "left",
    },
    centerAlign: {
      textAlign: "center",
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
