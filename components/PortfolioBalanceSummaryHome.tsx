import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, useWindowDimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import Svg, { Rect } from "react-native-svg";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getSuperFundDetails } from "../src/utils/pimsApi";
import { Props, PortfolioItem } from "../src/navigation/types";
import { useIsFocused } from "@react-navigation/native";
import { colors } from "../src/theme/colors";

// react-native-chart-kit BarChart defaults (style.paddingRight is used as the left inset)
const CHART_PADDING_LEFT = 64;
const CHART_PADDING_TOP = 16;
const BAR_WIDTH = 32;
const TOOLTIP_WIDTH = 150;
const TOOLTIP_HEIGHT = 50;

export default function PortfolioBalanceSummaryHome({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isFocused = useIsFocused();

  const fetchData = async () => {
    if (!userData?.authToken || !userData?.accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getSuperFundDetails(
        userData.authToken,
        userData.accountId
      );

      if (data) {
        setPortfolioData(
          data.map((item) => ({
            year: item.year,
            value: item.clientTotal,
            dataDownDate: item.dataDownDate,
          }))
        );
        setSelectedIndex(null);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  useEffect(() => {
    if (isFocused) {
      setSelectedIndex(null);
    }
  }, [isFocused]);

  const chartWidth = width * 0.9;
  const chartHeight = height * 0.4;
  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (!userData || error) {
    return <Text style={styles.errorText}>Data Loading Error...</Text>;
  }

  if (!portfolioData || portfolioData.length === 0) {
    return <Text style={styles.errorText}>No portfolio data available</Text>;
  }

  const sortedData = [...portfolioData].sort((a, b) => a.year - b.year);
  const latestFiveData = sortedData.slice(-5);

  const maxValue = Math.max(...latestFiveData.map((item) => item.value));

  const isMillion = maxValue >= 1_000_000;
  const divisor = isMillion ? 1_000_000 : 1_000;
  const suffix = isMillion ? "M" : "K";

  // Mirrors react-native-chart-kit's BarChart bar layout (with fromZero)
  // so taps map to the bar that is actually drawn.
  const slotWidth = (chartWidth - CHART_PADDING_LEFT) / latestFiveData.length;
  const barX = (index: number) =>
    CHART_PADDING_LEFT + index * slotWidth + BAR_WIDTH / 2;
  const barY = (value: number) =>
    CHART_PADDING_TOP +
    0.75 * chartHeight * (1 - Math.max(value, 0) / (maxValue || 1));
  const plotBottom = 0.75 * chartHeight + CHART_PADDING_TOP;

  const selectAt = (touchX: number) => {
    const index = Math.floor((touchX - CHART_PADDING_LEFT) / slotWidth);
    setSelectedIndex(Math.min(Math.max(index, 0), latestFiveData.length - 1));
  };

  const selected =
    selectedIndex !== null && selectedIndex < latestFiveData.length
      ? latestFiveData[selectedIndex]
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Portfolio Balance Summary</Text>

        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: latestFiveData.map((item) => `${item.year}`),
              datasets: [
                {
                  data: latestFiveData.map((item) => item.value / divisor),
                },
              ],
            }}
            width={chartWidth}
            height={chartHeight}
            yAxisLabel=""
            yAxisSuffix={suffix}
            chartConfig={{
              backgroundColor: "#f5f5f5",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 2,
              color: () => `rgba(195, 16, 231, 1)`,
              labelColor: () => `rgba(0, 0, 0, 1)`,
              barPercentage: 1,
              propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: "#e0e0e0",
                strokeDasharray: "5,5",
              },
              propsForLabels: {
                fontSize: RFPercentage(1.7),
              },
              formatYLabel: (yValue: string) => {
                const num = parseFloat(yValue);
                return num.toFixed(2);
              },
            }}
            fromZero
          />
          {selected && selectedIndex !== null && (
            <Svg
              width={chartWidth}
              height={chartHeight}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Rect
                x={barX(selectedIndex) - 3}
                y={barY(selected.value) - 3}
                width={BAR_WIDTH + 6}
                height={Math.max(plotBottom - barY(selected.value), 0) + 3}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2}
                rx={3}
              />
            </Svg>
          )}
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={(e) => selectAt(e.nativeEvent.locationX)}
            onResponderMove={(e) => selectAt(e.nativeEvent.locationX)}
          />
          {selected && selectedIndex !== null && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  left: Math.min(
                    Math.max(
                      barX(selectedIndex) + BAR_WIDTH / 2 - TOOLTIP_WIDTH / 2,
                      0
                    ),
                    chartWidth - TOOLTIP_WIDTH
                  ),
                  top: Math.max(barY(selected.value) - TOOLTIP_HEIGHT - 8, 0),
                },
              ]}
            >
              <Text style={styles.tooltipDate}>
                {new Date(selected.dataDownDate).toLocaleDateString("en-GB")}
              </Text>
              <Text style={styles.tooltipValue}>
                ${selected.value.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
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
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    chartContainer: {
      marginBottom: height * 0.01,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: height * 0.4,
    },
    bodyText: {
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.2),
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      minHeight: height * 0.8,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      textAlign: "center",
    },
    tooltip: {
      position: "absolute",
      width: TOOLTIP_WIDTH,
      height: TOOLTIP_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    tooltipDate: {
      fontSize: RFPercentage(1.5),
      color: "#6B7280",
    },
    tooltipValue: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: colors.primary,
    },
  });
