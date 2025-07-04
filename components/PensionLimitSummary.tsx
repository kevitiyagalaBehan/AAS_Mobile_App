import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getPensionLimitSummary } from "../src/utils/pimsApi";
import { Props, PensionLimitDetails } from "../src/navigation/types";

export default function PensionLimitSummary({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [pensionLimitSummary, setPensionLimitSummary] =
    useState<PensionLimitDetails | null>(null);
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
        const data = await getPensionLimitSummary(
          userData.authToken,
          userData.accountId
        );

        if (data) {
          setPensionLimitSummary(data);
        } else {
          setError("Failed to load pension limit summary");
        }
      } catch (err) {
        setError("Something went wrong while fetching pension limit summary");
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

  if (!pensionLimitSummary || error) {
    return <Text style={styles.errorText}>No pension data available</Text>;
  }

  const { financialYear, members } = pensionLimitSummary;

  if (!members || members.length === 0) {
    return null;
  }

  const formatShortFinancialYear = (fy: string) => {
    const [start, end] = fy.split("/");
    return `${start.slice(-2)}/${end.slice(-2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>
          Pension Limit Summary{" "}
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
          <TableSection label="MINIMUM PENSION PAYMENTS" styles={styles} />
          <TableRow
            label="Paid to date"
            renderRow={(member) => member.drawdownsToDate}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Minimum Pension Amount"
            renderRow={(member) => member.minimumPensionAmount}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Required For Minimum"
            renderRow={(member) => member.requiredForMinimum}
            members={members}
            styles={styles}
          />
          <TableSection label="MAXIMUM PENSION PAYMENTS" styles={styles} />
          <TableRow
            label="Maximum Pension Amount"
            renderRow={(member) => member.maximumPensionAmount}
            members={members}
            styles={styles}
          />
          <TableRow
            label="Remaining To Maximum"
            renderRow={(member) => member.remainingToMaximum}
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
}: {
  label: string;
  renderRow: (member: any) => number;
  members: any[];
  styles: any;
}) => (
  <View style={styles.row}>
    <Text style={[styles.cell, { flex: 2 }]}>{label}</Text>
    {members.map((member) => (
      <Text
        key={member.name}
        style={[styles.cell, styles.rightAlign, { flex: 2 }]}
      >
        {renderRow(member).toLocaleString()}
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
      paddingVertical: height * 0.003,
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
