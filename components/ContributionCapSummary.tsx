import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getContributionCapSummary } from "../src/utils/pimsApi";
import { ContributionCap, Props } from "../src/navigation/types";

export default function ContributionCapSummary({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [data, setData] = useState<ContributionCap | null>(null);
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
        const result = await getContributionCapSummary(
          userData.authToken,
          userData.accountId
        );

        if (result) {
          setData(result);
        } else {
          setError("Failed to load contribution cap summary");
        }
      } catch (err) {
        console.error("Error fetching contribution cap summary:", err);
        setError("Something went wrong while fetching data");
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

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data || !data.financialYear || !data.members || error) {
    return <Text style={styles.errorText}>No contribution data available</Text>;
  }

  const { financialYear, members } = data;

  const endDate = new Date(financialYear.endDate).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formatShortFinancialYear = (fy: string) => {
    const [start, end] = fy.split("/");
    return `${start.slice(-2)}/${end.slice(-2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>
          Contribution Cap Summary{" "}
          {formatShortFinancialYear(financialYear.financialYear)}
        </Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText1, { flex: 2 }]}>Members</Text>
            {members.map((member) => (
              <Text
                key={member.name}
                style={[
                  styles.tableHeaderText2,
                  styles.rightAlign,
                  { flex: 2 },
                ]}
              >
                {member.name}
              </Text>
            ))}
          </View>
          <TableRow
            label="Age"
            renderRow={(member) => member.age}
            members={members}
            styles={styles}
            endDate={endDate}
          />
          <TableSection label="CONCESSIONAL CONTRIBUTION" styles={styles} />
          <TableRow
            label="Paid to date"
            renderRow={(member) => member.concessionalPaidToDate}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Maximum"
            renderRow={(member) => member.concessionalMaximum}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Available"
            renderRow={(member) => member.concessionalAvailable}
            members={members}
            styles={styles}
          />
          <TableSection label="NON CONCESSIONAL CONTRIBUTION" styles={styles} />
          <TableRow
            label="Paid to date"
            renderRow={(member) => member.nonConcessionalPaidToDate}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Maximum"
            renderRow={(member) => member.nonConcessionalMaximum}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Available"
            renderRow={(member) => member.nonConcessionalAvailable}
            members={members}
            styles={styles}
          />
        </View>
      </View>
    </View>
  );
}

const TableRow = ({
  label,
  renderRow,
  members,
  styles,
  endDate,
}: {
  label: string;
  renderRow: (member: any) => number;
  members: any[];
  styles: any;
  endDate?: string;
}) => (
  <View style={styles.row}>
    <Text style={[styles.cell, { flex: 2 }]}>
      {label === "Age" && endDate ? `Age (As At ${endDate})` : label}
    </Text>

    {members.map((member) => (
      <Text
        key={member.name}
        style={[styles.cell, styles.rightAlign, { flex: 2 }]}
      >
        {label === "Age"
          ? renderRow(member).toLocaleString()
          : renderRow(member).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
      </Text>
    ))}
  </View>
);

const TableSection = ({ label, styles }: { label: string; styles: any }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
  </View>
);

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      marginTop: height * 0.01,
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
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      marginBottom: height * 0.001,
    },
    tableHeaderText1: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
      textAlign: "left",
    },
    tableHeaderText2: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
      textAlign: "right",
    },
    row: {
      flexDirection: "row",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      borderWidth: 1,
      borderColor: "#ccc",
      alignItems: "center",
      backgroundColor: "#fff",
    },
    cell: {
      fontSize: RFPercentage(2),
      color: "#333",
    },
    rightAlign: {
      textAlign: "right",
    },
    sectionHeader: {
      backgroundColor: "#ddd",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
    },
    sectionLabel: {
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.2,
    },
  });
