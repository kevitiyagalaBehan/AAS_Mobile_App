import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { G, Line, Circle } from "react-native-svg";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getInvestmentPerformance } from "../src/utils/pimsApi";
import { InvestmentPerformanceDetails, Props } from "../src/navigation/types";
import { useWindowSize } from "../hooks/useWindowSize";
import { colors } from "../src/theme/colors";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// react-native-chart-kit defaults (style.paddingRight is used as the left inset)
const CHART_PADDING_LEFT = 64;
const CHART_PADDING_TOP = 16;
const TOOLTIP_WIDTH = 120;
const TOOLTIP_HEIGHT = 44;

const formatDate = (date: Date) =>
  `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export default function InvestmentPerformance({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height, isPortrait } = useWindowSize();
  const [data, setData] = useState<InvestmentPerformanceDetails[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.authToken || !userData?.accountId) return;
      setLoading(true);
      try {
        const result = await getInvestmentPerformance(
          userData.authToken,
          userData.accountId,
        );
        if (result) {
          setData(result);
          setSelectedIndex(null);
        } else {
          setError("Failed to load investment performance.");
        }
      } catch {
        setError("Error fetching data.");
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

  if (!data || data.length === 0) {
    return <Text style={styles.errorText}>No investment data available</Text>;
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const values = sorted.map((item) => item.cumulativePercent);
  const dates = sorted.map((item) => new Date(item.date));

  // Show roughly five evenly spaced, horizontal "Mon YY" labels
  const labelStep = Math.max(1, Math.ceil(dates.length / 5));
  const labels = dates.map((date, index) =>
    index % labelStep === 0
      ? `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`
      : "",
  );

  const latestValue = values[values.length - 1];
  const isNegative = latestValue < 0;
  const trendColor = isNegative ? "#D64545" : "#1E9E5A";

  // Mirrors react-native-chart-kit's LineChart point layout (with fromZero)
  // so the touch marker lands exactly on the drawn line.
  const chartHeight = isPortrait ? height * 0.28 : height * 0.7;
  const plotBottom = chartHeight * 0.75 + CHART_PADDING_TOP;
  const maxValue = Math.max(...values, 0);
  const scaler = maxValue - Math.min(...values, 0) || 1;
  const stepX = (chartWidth - CHART_PADDING_LEFT) / values.length;
  const pointX = (index: number) => CHART_PADDING_LEFT + index * stepX;
  const pointY = (value: number) =>
    CHART_PADDING_TOP + (0.75 * chartHeight * (maxValue - value)) / scaler;

  const selectAt = (touchX: number) => {
    const index = Math.round((touchX - CHART_PADDING_LEFT) / stepX);
    setSelectedIndex(Math.min(Math.max(index, 0), values.length - 1));
  };

  const selectedPoint =
    selectedIndex !== null && selectedIndex < values.length
      ? {
          index: selectedIndex,
          x: pointX(selectedIndex),
          y: pointY(values[selectedIndex]),
        }
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Investment Performance</Text>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryValue, { color: trendColor }]}>
            {isNegative ? "▼" : "▲"} {Math.abs(latestValue).toFixed(2)}%
          </Text>
          <Text style={styles.summaryCaption}>
            Cumulative return since {formatDate(dates[0])}
          </Text>
        </View>

        <View
          style={styles.chartWrapper}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        >
          {chartWidth > 0 && (
            <View style={styles.chart}>
              <LineChart
                data={{
                  labels,
                  datasets: [
                    {
                      data: values,
                      strokeWidth: 2,
                      color: () => colors.primary,
                    },
                  ],
                }}
                width={chartWidth}
                height={chartHeight}
                yAxisSuffix="%"
                withDots={false}
                withShadow
                fromZero
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines
                segments={4}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(${colors.primaryRgb}, ${opacity})`,
                  labelColor: () => "#6B7280",
                  fillShadowGradientFrom: colors.primary,
                  fillShadowGradientFromOpacity: 0.25,
                  fillShadowGradientTo: colors.primary,
                  fillShadowGradientToOpacity: 0.02,
                  propsForBackgroundLines: {
                    stroke: "#E5E7EB",
                    strokeDasharray: "4 4",
                  },
                  propsForLabels: {
                    fontSize: RFPercentage(1.4),
                  },
                }}
                decorator={() =>
                  selectedPoint && (
                    <G>
                      <Line
                        x1={selectedPoint.x}
                        y1={CHART_PADDING_TOP}
                        x2={selectedPoint.x}
                        y2={plotBottom}
                        stroke="#9CA3AF"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                      <Circle
                        cx={selectedPoint.x}
                        cy={selectedPoint.y}
                        r={5}
                        fill={colors.primary}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </G>
                  )
                }
                bezier
              />
              <View
                style={StyleSheet.absoluteFill}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderTerminationRequest={() => false}
                onResponderGrant={(e) => selectAt(e.nativeEvent.locationX)}
                onResponderMove={(e) => selectAt(e.nativeEvent.locationX)}
              />
              {selectedPoint && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.tooltip,
                    {
                      left: Math.min(
                        Math.max(selectedPoint.x - TOOLTIP_WIDTH / 2, 0),
                        chartWidth - TOOLTIP_WIDTH,
                      ),
                      top:
                        selectedPoint.y > TOOLTIP_HEIGHT + 12
                          ? selectedPoint.y - TOOLTIP_HEIGHT - 10
                          : selectedPoint.y + 10,
                    },
                  ]}
                >
                  <Text style={styles.tooltipDate}>
                    {formatDate(dates[selectedPoint.index])}
                  </Text>
                  <Text
                    style={[
                      styles.tooltipValue,
                      {
                        color:
                          values[selectedPoint.index] < 0
                            ? "#D64545"
                            : "#1E9E5A",
                      },
                    ]}
                  >
                    {values[selectedPoint.index] < 0 ? "▼" : "▲"}{" "}
                    {Math.abs(values[selectedPoint.index]).toFixed(2)}%
                  </Text>
                </View>
              )}
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
      marginTop: 12,
      borderRadius: 16,
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
    bodyText: {
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.2),
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      marginBottom: height * 0.01,
    },
    summaryValue: {
      fontSize: RFPercentage(2.6),
      fontWeight: "bold",
      marginRight: 8,
    },
    summaryCaption: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
    },
    chartWrapper: {
      width: "100%",
      paddingBottom: height * 0.01,
    },
    chart: {
      marginLeft: -width * 0.02,
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: height * 0.2,
    },
  });
