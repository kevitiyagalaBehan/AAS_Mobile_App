import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import React from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { PortfolioData } from "../src/navigation/types";

export default function ConsolidatedAssetAllocation({
  data,
  loading,
  error,
}: {
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
}) {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data || error) {
    return <Text style={styles.errorText}>No portfolio data available</Text>;
  }

  const dataWithTotal = [
    ...data.assetCategories,
    {
      assetCategory: "TOTAL",
      marketValue: data.totalMarketValue,
      percentage: data.totalPercentage,
      assetClasses: [],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Consolidated Asset Allocation</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText1, { flex: 1 }]}>
              Asset Class
            </Text>
            <Text
              style={[styles.tableHeaderText2, styles.rightAlign, { flex: 1 }]}
            >
              Current $
            </Text>
            <Text
              style={[styles.tableHeaderText2, styles.rightAlign, { flex: 1 }]}
            >
              Current %
            </Text>
          </View>

          {dataWithTotal.map((category, index) => (
            <View key={index}>
              <TableRow
                label={category.assetCategory.toUpperCase()}
                marketValue={category.marketValue}
                percentage={category.percentage}
                styles={styles}
                isCategory
              />
              {category.assetClasses?.map((subItem, idx) => (
                <TableRow
                  key={idx}
                  label={subItem.assetClass}
                  marketValue={subItem.marketValue}
                  percentage={subItem.percentage}
                  styles={styles}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const TableRow = ({
  label,
  marketValue,
  percentage,
  styles,
  isCategory = false,
}: {
  label: string;
  marketValue: number;
  percentage: number;
  styles: any;
  isCategory?: boolean;
}) => (
  <View style={[styles.row, isCategory && styles.categoryRow]}>
    <Text style={[styles.cell, isCategory && styles.boldText, { flex: 1 }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.cell,
        styles.rightAlign,
        isCategory && styles.boldText,
        { flex: 1 },
      ]}
    >
      {marketValue.toLocaleString()}
    </Text>
    <Text
      style={[
        styles.cell,
        styles.rightAlign,
        isCategory && styles.boldText,
        { flex: 1 },
      ]}
    >
      {percentage.toFixed(2)}
    </Text>
  </View>
);

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      //marginBottom: height * 0.01,
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
      marginTop: height * 0.01,
      marginLeft: height * 0.012,
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
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.2,
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
    categoryRow: {
      backgroundColor: "#ddd",
    },
    rightAlign: {
      textAlign: "right",
    },
    cell: {
      fontSize: RFPercentage(2),
      color: "#000000",
    },
    boldText: {
      fontWeight: "bold",
    },
  });
