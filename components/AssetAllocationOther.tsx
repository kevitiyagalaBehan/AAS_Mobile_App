import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import React, { useState, useEffect } from "react";
import AssetAllocationDonut from "./AssetAllocationDonut";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ChartData, PortfolioData, Props } from "../src/navigation/types";
import { getAssetAllocationSummaryOther } from "../src/utils/pimsApi";
import { useAuth } from "../src/context/AuthContext";
import { getColorForAssetClass } from "../src/utils/assetColors";
import { colors } from "../src/theme/colors";

export default function AssetAllocationOther({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
      const fetchData = async () => {
        if (!userData?.authToken || !userData?.accountId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const data = await getAssetAllocationSummaryOther(
            userData.authToken,
            userData.accountId
          );
          setData(data);
        } catch (err) {
          setError("Failed to load investment details");
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  useEffect(() => {
    if (!data) return;

    const processed: ChartData[] = [];
    data.assetCategories?.forEach((category) =>
      category.assetClasses?.forEach((asset) => {
        processed.push({
          name: asset.assetClass,
          percentage: asset.percentage,
          color: getColorForAssetClass(asset.assetClass),
          legendFontColor: "#000000",
          legendFontSize: RFPercentage(2),
        });
      })
    );
    setChartData(processed);
  }, [data]);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
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
      //marginBottom: height * 0.01,
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
      marginLeft: height * 0.02,
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
