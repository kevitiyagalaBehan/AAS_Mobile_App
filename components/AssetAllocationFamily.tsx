import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import React, { useState, useEffect } from "react";
import AssetAllocationDonut from "./AssetAllocationDonut";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ChartData, PortfolioData } from "../src/navigation/types";
import { getColorForAssetClass } from "../src/utils/assetColors";
import { colors } from "../src/theme/colors";

export default function AssetAllocationFamily({
  data,
  loading,
  error,
}: {
  data: PortfolioData | null;
  loading: boolean;
  error: string | null;
}) {
  const { width, height } = useWindowDimensions();
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (!data) return;

    const processed: ChartData[] = [];
    data.assetCategories?.forEach((category) =>
      category.assetClasses?.forEach((asset) => {
        processed.push({
          name: asset.assetClass,
          percentage: asset.percentage,
          color: getColorForAssetClass(asset.assetClass),
          legendFontColor: "#333",
          legendFontSize: RFPercentage(1.8),
        });
      })
    );
    setChartData(processed);
  }, [data]);

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data || error) {
    return (
      <Text style={styles.errorText}>No asset allocation data available</Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Allocation chart</Text>
        {chartData.length > 0 ? (
          <AssetAllocationDonut data={chartData} />
        ) : (
          <Text style={styles.noDataText}>
            No asset allocation data available
          </Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: 16,
      marginTop: 12,
    },
    border: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#fff",
    },
    loader: {
      fontWeight: "bold",
      color: colors.primary,
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.363,
      marginLeft: height * 0.012,
    },
    bodyText: {
      fontWeight: "bold",
      color: colors.primary,
      fontSize: RFPercentage(2.2),
      marginTop: height * 0.008,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.53,
    },
    noDataText: {
      textAlign: "center",
      marginTop: height * 0.01,
      fontSize: RFPercentage(2),
      color: "#666",
    },
  });
