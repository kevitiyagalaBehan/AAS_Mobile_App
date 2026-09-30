import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import Svg, { Circle, G } from "react-native-svg";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ChartData } from "../src/navigation/types";

const GAP_DEGREES = 2.5;

export default function AssetAllocationDonut({ data }: { data: ChartData[] }) {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const size = Math.min(width * 0.42, 180);
  const strokeWidth = size * 0.14;
  const radius = (size - strokeWidth * 1.3) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const total = data.reduce((sum, item) => sum + Math.max(item.percentage, 0), 0);

  const largestIndex = useMemo(
    () =>
      data.reduce(
        (best, item, i) => (item.percentage > data[best].percentage ? i : best),
        0
      ),
    [data]
  );
  const [selected, setSelected] = useState(largestIndex);

  useEffect(() => {
    setSelected(largestIndex);
  }, [largestIndex]);

  const visibleCount = data.filter((item) => item.percentage > 0).length;
  const gap = visibleCount > 1 ? (GAP_DEGREES / 360) * circumference : 0;

  let cumulative = 0;
  const segments = data.map((item, index) => {
    const fraction = total > 0 ? Math.max(item.percentage, 0) / total : 0;
    const start = cumulative * circumference;
    cumulative += fraction;
    const length = Math.max(fraction * circumference - gap, 0);
    return { item, index, start, length };
  });

  const active = data[selected];

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#EEF3F8"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {segments.map(({ item, index, start, length }) =>
              length > 0 ? (
                <Circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={index === selected ? strokeWidth * 1.3 : strokeWidth}
                  strokeOpacity={index === selected ? 1 : 0.85}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-start}
                  fill="none"
                  onPress={() => setSelected(index)}
                />
              ) : null
            )}
          </G>
        </Svg>
        {active && (
          <View style={styles.centerLabel} pointerEvents="none">
            <Text style={styles.centerValue}>{active.percentage.toFixed(1)}%</Text>
            <Text style={styles.centerName} numberOfLines={2}>
              {active.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => setSelected(index)}
            style={[styles.legendItem, index === selected && styles.legendItemActive]}
          >
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.legendValue}>{item.percentage.toFixed(2)}%</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: height * 0.012,
    },
    centerLabel: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: "22%",
    },
    centerValue: {
      fontSize: RFPercentage(2.8),
      fontWeight: "bold",
      color: "#001F5B",
    },
    centerName: {
      fontSize: RFPercentage(1.6),
      color: "#666",
      textAlign: "center",
    },
    legendContainer: {
      flex: 1,
      marginLeft: width * 0.03,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: height * 0.006,
      paddingHorizontal: width * 0.02,
      borderRadius: 6,
    },
    legendItemActive: {
      backgroundColor: "#EEF3F8",
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    legendText: {
      flex: 1,
      fontSize: RFPercentage(1.8),
      color: "#333",
    },
    legendValue: {
      fontSize: RFPercentage(1.8),
      fontWeight: "600",
      color: "#000000",
      marginLeft: 4,
    },
  });
