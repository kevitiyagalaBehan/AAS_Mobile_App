import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getConsolidateData } from "../src/utils/pimsApi";
import { ConsolidateData, Props } from "../src/navigation/types";

export default function ConsolidatedAccounts({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [accounts, setAccounts] = useState<ConsolidateData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ConsolidateData | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getConsolidateData(
          userData.authToken,
          userData.accountId
        );
        setAccounts(data);
      } catch (err) {
        setError("Failed to load investment details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const handleCodePress = (item: ConsolidateData) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!accounts || accounts.length === 0) {
    return <Text style={styles.errorText}>No consolidate data available</Text>;
  }

  const totalPortfolioValue = accounts?.reduce(
    (sum, item) => sum + item.portfolioValue,
    0
  );

  const totalPortfolioPercentage = accounts?.reduce(
    (sum, item) => sum + item.portfolioPercentage,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Consolidated Accounts</Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell1, { flex: 1 }]}>Code</Text>
            <Text style={[styles.headerCell2, { flex: 1 }]}>Ammount $</Text>
            <Text style={[styles.headerCell2, { flex: 1 }]}>%</Text>
          </View>

          {accounts?.map((item, index) => (
            <View
              key={item.clientCode}
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
                    styles.boldText,
                    styles.leftAlign,
                    styles.underlineText,
                  ]}
                  numberOfLines={1}
                >
                  {item.clientCode}
                </Text>
              </TouchableOpacity>
              <Text
                style={[styles.dataCell, styles.rightAlign, { flex: 1 }]}
                numberOfLines={1}
              >
                {item.portfolioValue.toLocaleString()}
              </Text>
              <Text
                style={[styles.dataCell, styles.rightAlign, { flex: 1 }]}
                numberOfLines={1}
              >
                {item.portfolioPercentage.toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={[styles.dataRow, { backgroundColor: "#D3EAFD" }]}>
            <Text
              style={[
                styles.dataCell,
                styles.boldText,
                styles.leftAlign,
                { flex: 1 },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                styles.dataCell,
                styles.boldText,
                styles.rightAlign,
                { flex: 1 },
              ]}
            >
              {totalPortfolioValue?.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.dataCell,
                styles.boldText,
                styles.rightAlign,
                { flex: 1 },
              ]}
            >
              {totalPortfolioPercentage?.toFixed(2)}%
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
                  <Text style={styles.modalTitle}>
                    {selectedItem.clientCode}
                  </Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Name:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.clientName}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Entity:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.entityType}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Amount:</Text>
                    <Text style={styles.modalText}>
                      ${selectedItem.portfolioValue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Percentage:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.portfolioPercentage.toFixed(2)}%
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
      backgroundColor: "#fff",
      borderRadius: 6,
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
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
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
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ccc",
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
