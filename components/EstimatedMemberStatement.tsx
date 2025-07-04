import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getEstimatedMemberStatement } from "../src/utils/pimsApi";
import { EstimatedMemberDetails, Props } from "../src/navigation/types";

export default function EstimatedMemberStatement({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [estimatedMemberStatement, setEstimatedMemberStatement] = useState<
    EstimatedMemberDetails[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(toDate.getFullYear() - 1);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await getEstimatedMemberStatement(
          userData.authToken,
          userData.accountId,
          fromDate,
          toDate
        );

        if (Array.isArray(data)) {
          setEstimatedMemberStatement(data);
        } else {
          setError("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching estimated member statement:", err);
        setError("Failed to fetch estimated member statement");
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

  if (!estimatedMemberStatement || estimatedMemberStatement.length === 0) {
    return <Text style={styles.errorText}>No estimated data available</Text>;
  }

  const members = estimatedMemberStatement;

  const formatWithPercentage = (value: number, total: number): string => {
    if (!total || total === 0) return "0 (0%)";
    const percentage = (value / total) * 100;
    return `${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })} (${percentage.toFixed(2)}%)`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>
          Estimated Member Statement As At{" "}
          {new Date().toLocaleDateString("en-AU")}
        </Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText1, { flex: 2 }]}>Members</Text>
            {members.map((member) => (
              <Text
                key={member.memberName}
                style={[
                  styles.tableHeaderText2,
                  styles.rightAlign,
                  { flex: 2 },
                ]}
              >
                {member.memberName}
              </Text>
            ))}
          </View>

          <TableRow
            label="Accumulation"
            renderRow={(member) =>
              formatWithPercentage(
                member.accumulation,
                member.accumulation + member.pension
              )
            }
            members={members}
            styles={styles}
          />
          <TableRow
            label="Pension"
            renderRow={(member) =>
              formatWithPercentage(
                member.pension,
                member.accumulation + member.pension
              )
            }
            members={members}
            styles={styles}
          />
          <TableRow
            label={`TOTAL`}
            renderRow={(member) =>
              (member.accumulation + member.pension).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })
            }
            members={members}
            styles={styles}
            bold
          />

          <TableSection label="TAX COMPONENTS" styles={styles} />
          <TableRow
            label="Tax Free"
            renderRow={(member) =>
              formatWithPercentage(
                member.taxFree,
                member.taxFree + member.taxableTaxed + member.taxableUntaxed
              )
            }
            members={members}
            styles={styles}
          />
          <TableRow
            label="Taxable Taxed"
            renderRow={(member) =>
              formatWithPercentage(
                member.taxableTaxed,
                member.taxFree + member.taxableTaxed + member.taxableUntaxed
              )
            }
            members={members}
            styles={styles}
          />
          <TableRow
            label="Taxable Untaxed"
            renderRow={(member) =>
              formatWithPercentage(
                member.taxableUntaxed,
                member.taxFree + member.taxableTaxed + member.taxableUntaxed
              )
            }
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
  bold = false,
}: {
  label: string;
  renderRow: (member: any) => string;
  members: any[];
  styles: any;
  bold?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={[styles.cell, bold && styles.boldText, { flex: 2 }]}>
      {label}
    </Text>
    {members.map((member) => (
      <Text
        key={member.memberName}
        style={[
          styles.cell,
          styles.rightAlign,
          bold && styles.boldText,
          { flex: 2 },
        ]}
      >
        {renderRow(member)}
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
      marginLeft: height * 0.013,
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
    boldText: {
      fontWeight: "bold",
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.2,
    },
  });

{/*
  <TableRow
            label={`TOTAL AS AT ${new Date().toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`}
            renderRow={(member) =>
              (member.accumulation + member.pension).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })
            }
            members={members}
            styles={styles}
            bold
          />
  */}
