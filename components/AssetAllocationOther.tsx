import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import React, { useState, useEffect } from "react";
import { PieChart } from "react-native-chart-kit";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ChartData, PortfolioData, Props } from "../src/navigation/types";
import { getAssetAllocationSummaryOther } from "../src/utils/pimsApi";
import { useAuth } from "../src/context/AuthContext";

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

  const getColorForAssetClass = (assetClass: string) => {
    const colorMap: { [key: string]: string } = {
      Cash: "#5DA8A7",
      "Aust. Equities": "#7AC2E1",
      "Int. Equities": "#677EB5",
      Property: "#A46E7E",
      Other: "#EDBE72",
    };
    return colorMap[assetClass] || "#999";
  };

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
        <Text style={styles.bodyText}>Asset Allocation</Text>
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={width * 1.0}
              height={Math.min(height * 0.3, 220)}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                color: (opacity = 1) => `rgba(0, 31, 91, ${opacity})`,
              }}
              accessor="percentage"
              backgroundColor="transparent"
              paddingLeft={`${width * 0.25}`}
              absolute
              hasLegend={false}
            />
            <View style={styles.legendContainer}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[styles.colorBox, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.legendText}>
                    {item.name}: {item.percentage.toFixed(2)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
      borderRadius: 6,
      //marginBottom: height * 0.01,
      marginTop: height * 0.01,
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
      marginTop: height * 0.363,
      marginLeft: height * 0.02,
    },
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginBottom: -15,
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
    chartContainer: {
      alignItems: "center",
    },
    legendContainer: {
      marginBottom: height * 0.01,
      //flexDirection: "row",
      //flexWrap: "wrap",
      //justifyContent: "center",
      alignItems: "flex-start",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      width: "50%",
    },
    colorBox: {
      width: 12,
      height: 12,
      marginRight: 8,
      borderRadius: 3,
    },
    legendText: {
      fontSize: RFPercentage(2),
      color: "#000000",
    },
  });
