import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  useWindowDimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getCashTransactions } from "../src/utils/pimsApi";
import { CashTransactions } from "../src/navigation/types";
import { useRefreshTrigger } from "../hooks/useRefreshTrigger";
import { SelectList } from "react-native-dropdown-select-list";

export default function Transactions() {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [transactions, setTransactions] = useState<CashTransactions[] | null>(
    null
  );
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return oneMonthAgo;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isScrollable, setIsScrollable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CashTransactions | null>(
    null
  );
  const [holdingDescriptions, setHoldingDescriptions] = useState<
    { key: string; value: string }[]
  >([]);
  const [selectedHolding, setSelectedHolding] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    if (!userData?.authToken || !userData?.accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const formatDate = (date: Date) => date.toISOString().split("T")[0];
      const data = await getCashTransactions(
        userData.authToken,
        userData.accountId,
        formatDate(startDate),
        formatDate(endDate)
      );

      if (data) {
        setTransactions(data);

        const uniqueHoldings = Array.from(
          new Set(data.map((item) => item.holdingDescription))
        ).map((desc) => ({
          key: desc,
          value: desc,
        }));

        setHoldingDescriptions([{ key: "", value: "All" }, ...uniqueHoldings]);
      }
    } catch (err) {
      setError("Failed to load transaction details");
    } finally {
      setLoading(false);
    }
  };

  const { refreshTrigger, refreshing, onRefresh } =
    useRefreshTrigger(fetchData);

  useEffect(() => {
    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const handleCodePress = (item: CashTransactions) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const filteredTransactions = selectedHolding
    ? transactions?.filter((t) => t.holdingDescription === selectedHolding)
    : transactions;

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!transactions) {
    return <Text style={styles.errorText}>No transactions data available</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Cash Transactions</Text>

        <View style={styles.filterContainer}>
          <Text style={styles.label}>From:</Text>
          <View style={styles.leftItem}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color="#1B77BE" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>To:</Text>
          <View style={styles.rightItem}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>
                {endDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color="#1B77BE" />
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (event.type === "set" && selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (event.type === "set" && selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}

        <SelectList
          setSelected={setSelectedHolding}
          data={holdingDescriptions}
          save="key"
          placeholder="All"
          //boxStyles={styles.dropDownBox}
          //dropdownStyles={styles.dropDownList}
          dropdownItemStyles={styles.dropdownItem}
        />

        <TouchableOpacity style={styles.applyButton} onPress={fetchData}>
          <Text style={styles.applyButtonText}>Filter</Text>
        </TouchableOpacity>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell1, { flex: 1.5 }]}>
              Date Description
            </Text>
            <Text style={[styles.headerCell2, { flex: 1 }]}>Amount ($)</Text>
            <Text style={[styles.headerCell2, { flex: 1 }]}>Balance ($)</Text>
          </View>
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.dataRow,
                  { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleCodePress(item)}
                  style={{ flex: 1.5 }}
                >
                  <View style={{ flexDirection: "column" }}>
                    <Text style={[styles.dataCell, styles.leftAlign]}>
                      {new Date(item.transactionDate).toLocaleDateString(
                        "en-AU",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.dataCell,
                        styles.leftAlign,
                        styles.underlineText,
                      ]}
                    >
                      {item.transactionDescription?.includes("Closing Balance")
                        ? item.transactionDescription
                            .replace("Closing Balance", "")
                            .trim()
                        : item.transactionDescription}
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text
                  style={[styles.dataCell, styles.rightAlign, { flex: 1 }]}
                  numberOfLines={1}
                >
                  {item.credit != null
                    ? item.credit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })
                    : item.debit != null
                    ? `(${item.debit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })})`
                    : ""}
                </Text>

                <Text
                  style={[styles.dataCell, styles.rightAlign, { flex: 1 }]}
                  numberOfLines={1}
                >
                  {item.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onContentSizeChange={(_, contentHeight) => {
              setIsScrollable(contentHeight > height);
            }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: isScrollable ? height * 1.16 : 20,
            }}
            ListEmptyComponent={() => (
              <Text style={styles.noData}>No transactions available</Text>
            )}
            showsVerticalScrollIndicator={false}
          />
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
                    {selectedItem.holdingDescription}
                  </Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Date:</Text>
                    <Text style={styles.modalText}>
                      {new Date(
                        selectedItem.transactionDate
                      ).toLocaleDateString("en-GB")}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Classification:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.classification}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Withdrawal:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.debit != null
                        ? selectedItem.debit.toLocaleString()
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Deposit:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.credit != null
                        ? selectedItem.credit.toLocaleString()
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Balance:</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.balance.toLocaleString()}
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
      marginTop: height * 0.02,
      backgroundColor: "#fff",
      borderRadius: 6,
    },
    listContentContainer: {
      //paddingBottom: height * 0.44,
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
    filterContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: height * 0.01,
      gap: 10,
      //flexWrap: "wrap",
    },
    label: {
      fontSize: RFPercentage(2),
    },
    leftItem: {
      height: height * 0.045,
      alignItems: "center",
      justifyContent: "center",
    },
    rightItem: {
      height: height * 0.045,
      alignItems: "center",
      justifyContent: "center",
    },
    dropdownItem: {
      paddingHorizontal: width * 0.06,
    },
    datePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f0f0f0",
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      flex: 1,
    },
    dateText: {
      fontSize: RFPercentage(2),
      color: "#1B77BE",
      marginRight: width * 0.02,
    },
    applyButton: {
      backgroundColor: "#1B77BE",
      paddingVertical: 10,
      marginVertical: height * 0.01,
      borderRadius: 8,
      alignItems: "center",
    },
    applyButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },

    tableContainer: {
      //paddingVertical: height * 0.01,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    errorText: {
      color: "black",
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
      borderWidth: 1,
      borderColor: "#ccc",
      alignItems: "center",
    },
    dataCell: {
      fontSize: RFPercentage(2),
      color: "#333",
    },
    noData: {
      textAlign: "center",
      marginVertical: height * 0.02,
      color: "#888",
      fontSize: RFPercentage(2),
    },
    underlineText: {
      textDecorationLine: "underline",
      color: "#1B77BE",
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
