import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../src/context/AuthContext";
import {
  getClientAccountDetails,
  getRelationships,
} from "../src/utils/pimsApi";
import {
  ClientAccountDetails,
  Props,
  RelationshipResponse,
} from "../src/navigation/types";
import { RFPercentage } from "react-native-responsive-fontsize";

export default function Details({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [relationshipsLoading, setRelationshipsLoading] = useState(true);
  const [details, setDetails] = useState<ClientAccountDetails[] | null>(null);
  const [relationships, setRelationships] = useState<
    RelationshipResponse[] | null
  >(null);
  const [selectedTab, setSelectedTab] = useState<
    "accountDetails" | "relationships"
  >("accountDetails");
  const [error, setError] = useState<string | null>(null);
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setDetailsLoading(false);
        return;
      }

      setDetailsLoading(true);
      try {
        const data = await getClientAccountDetails(
          userData.authToken,
          userData.accountId
        );
        setDetails(data);
      } catch {
        setError("Failed to load account details");
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  useEffect(() => {
    const fetchRelationships = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setRelationshipsLoading(false);
        return;
      }

      setRelationshipsLoading(true);
      try {
        const data = await getRelationships(
          userData.authToken,
          userData.accountId
        );
        setRelationships(data);
      } catch {
        setError("Failed to load relationships");
      } finally {
        setRelationshipsLoading(false);
      }
    };

    fetchRelationships();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  if (detailsLoading || relationshipsLoading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!details || details.length === 0) {
    return <Text style={styles.errorText}>No account details available</Text>;
  }

  if (!relationships || relationships.length === 0) {
    return (
      <Text style={styles.errorText}>No relationships data available</Text>
    );
  }

  const account = details[0];

  const rows = [
    { label: "Portfolio Code", value: account.superFundCode },
    { label: "Account Name", value: account.superFundName },
    { label: "Legal Type", value: account.legalType },
    { label: "Trustee(s)", value: account.trusteeName },
    { label: "Job Type", value: account.jobType },
    { label: "ABN", value: account.fundABN },
    { label: "TFN", value: account.fundTFN || "<<Recorded>>" },
    {
      label: "SOA Date",
      value: new Date(account.soaDate).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
    {
      label: "Fund Start Date",
      value: new Date(account.fundStartDate).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
    { label: "Adviser", value: account.adviserName },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "accountDetails" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("accountDetails")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "accountDetails" && styles.activeTabText,
              ]}
            >
              Account Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "relationships" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("relationships")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "relationships" && styles.activeTabText,
              ]}
            >
              Relationships
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "accountDetails" && (
          <View>
            {rows.map((item, index) => (
              <View key={index} style={styles.row}>
                <View style={styles.labelCell}>
                  <Text style={styles.labelText}>{item.label}</Text>
                </View>
                <View
                  style={[
                    styles.valueCell,
                    { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
                  ]}
                >
                  <Text style={styles.valueText}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === "relationships" && (
          <View>
            {relationships && relationships.length > 0 ? (
              relationships.map((relGroup, i) => (
                <View key={i} style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>{relGroup.accountName}</Text>
                  </View>
                  <View
                    style={[
                      styles.valueCell,
                      { backgroundColor: i % 2 === 0 ? "#eee" : "#fff" },
                    ]}
                  >
                    <Text style={styles.valueText}>
                      {relGroup.relationships
                        .map((r) => r.relationship)
                        .join(", ")}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.valueText}>No relationships available</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginVertical: height * 0.02,
      borderRadius: 6,
      backgroundColor: "#fff",
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      padding: width * 0.02,
    },
    row: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: "#ccc",
    },
    labelCell: {
      flex: 1,
      backgroundColor: "#1B77BE",
      justifyContent: "center",
      padding: 10,
    },
    valueCell: {
      flex: 2,
      justifyContent: "center",
      padding: 10,
      backgroundColor: "#fff",
    },
    labelText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    valueText: {
      color: "#000",
      fontSize: RFPercentage(2),
    },
    tabContainer: {
      flexDirection: "row",
    },
    tab: {
      flex: 1,
      padding: 12,
      backgroundColor: "#fff",
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: "#1B77BE",
    },
    tabText: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: "#1B77BE",
    },
    activeTabText: {
      color: "#fff",
    },
    errorText: {
      color: "red",
      textAlign: "center",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      marginTop: height * 0.2,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.013,
    },
  });
