import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getAccountList } from "../src/utils/pimsApi";
import {
  AccountEntity,
  AccountIndividual,
  Props,
} from "../src/navigation/types";

export default function AccountList({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [entities, setEntities] = useState<AccountEntity[]>([]);
  const [individuals, setIndividuals] = useState<AccountIndividual[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndividual, setSelectedIndividual] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [individualModalVisible, setIndividualModalVisible] = useState(false);
  const [entityModalVisible, setEntityModalVisible] = useState(false);
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { entities, individuals } = await getAccountList(
          userData.authToken,
          userData.accountId
        );
        setEntities(entities);
        setIndividuals(individuals);
      } catch (err) {
        setError("Failed to load client account details");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const handleIndividualPress = (item: AccountIndividual) => {
    setSelectedIndividual(item);
    setIndividualModalVisible(true);
  };

  const handleEntityPress = (item: AccountEntity) => {
    setSelectedEntity(item);
    setEntityModalVisible(true);
  };

  const renderIndividualModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={individualModalVisible}
      onRequestClose={() => setIndividualModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedIndividual && (
            <>
              <Text style={styles.modalTitle}>
                {selectedIndividual.accountName}
              </Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Email:</Text>
                <Text style={styles.modalText}>{selectedIndividual.email}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>DOB(Age):</Text>
                <Text style={styles.modalText}>{selectedIndividual.dob}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Relationship:</Text>
                <Text style={styles.modalText}>
                  {selectedIndividual.relationship}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIndividualModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderEntityModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={entityModalVisible}
      onRequestClose={() => setEntityModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedEntity && (
            <>
              <Text style={styles.modalTitle}>
                {selectedEntity.accountName}
              </Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Entity Type:</Text>
                <Text style={styles.modalText}>
                  {selectedEntity.accountType}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>ABN:</Text>
                <Text style={styles.modalText}>{selectedEntity.abn}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>TFN:</Text>
                <Text style={styles.modalText}>{selectedEntity.tfn}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Active Portfolio:</Text>
                <Text style={styles.modalText}>
                  {selectedEntity.activePortfolio}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEntityModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!entities || entities.length === 0) {
    return (
      <Text style={styles.errorText}>No client account details available</Text>
    );
  }
  if (!individuals || individuals.length === 0) {
    return (
      <Text style={styles.errorText}>No client account details available</Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Account List</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Individual</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>DOB(Age)</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Relationship</Text>
          </View>

          {individuals.map((ind, index) => (
            <View
              key={ind.id}
              style={[
                styles.dataRow,
                { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleIndividualPress(ind)}
                style={{ flex: 2 }}
              >
                <Text
                  style={[styles.dataCell, styles.underlineText]}
                  numberOfLines={1}
                >
                  {ind.accountName}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.dataCell, { flex: 1.5 }]}>{ind.dob}</Text>
              <Text style={[styles.dataCell, { flex: 1 }]}>
                {ind.relationship}
              </Text>
            </View>
          ))}

          <View style={[styles.tableHeader, { marginTop: height * 0.03 }]}>
            <Text style={[styles.headerCell, { flex: 2.67 }]}>Entity</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>ABN</Text>
          </View>

          {entities.map((ent, index) => (
            <View
              key={ent.id}
              style={[
                styles.dataRow,
                { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleEntityPress(ent)}
                style={{ flex: 2.67 }}
              >
                <Text
                  style={[styles.dataCell, styles.underlineText]}
                  numberOfLines={1}
                >
                  {ent.accountName}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.dataCell, { flex: 1 }]}>{ent.abn}</Text>
            </View>
          ))}
        </View>
      </View>
      {renderIndividualModal()}
      {renderEntityModal()}
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
      marginBottom: height * 0.01,
      fontSize: RFPercentage(2.6),
    },
    tableContainer: {
      paddingBottom: height * 0.01,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.01,
      paddingHorizontal: width * 0.02,
    },
    headerCell: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    dataRow: {
      flexDirection: "row",
      paddingVertical: height * 0.01,
      paddingHorizontal: width * 0.02,
      borderWidth: 1,
      borderColor: "#ccc",
    },
    dataCell: {
      fontSize: RFPercentage(2),
      color: "#333",
    },
    underlineText: {
      textDecorationLine: "underline",
      color: "#1B77BE",
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      textAlign: "center",
      marginTop: height * 0.3,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.013,
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
