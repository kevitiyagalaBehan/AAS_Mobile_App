import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { formatCurrency } from "../src/utils/format";
import { colors } from "../src/theme/colors";

export const CONCESSIONAL_COLOR = "#5DA8A7";

export function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

type CapRowProps = {
  label: string;
  paid: number;
  maximum: number;
  available: number;
  barColor: string;
  isLast?: boolean;
};

// One contribution cap (concessional or non-concessional) with its usage bar
export function CapRow({ label, paid, maximum, available, barColor, isLast }: CapRowProps) {
  return (
    <View style={[styles.block, !isLast && styles.divider]}>
      {maximum <= 0 ? (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.unavailable}>Not available · $0 cap</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.available}>{formatCurrency(available, 0)} available</Text>
          </View>
          <ProgressBar value={paid} max={maximum} color={barColor} />
          <Text style={styles.helper}>
            {formatCurrency(paid, 0)} of {formatCurrency(maximum, 0)} used
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 10,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  block: {
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: RFPercentage(1.9),
    color: "#111827",
  },
  available: {
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    color: colors.primary,
  },
  unavailable: {
    fontSize: RFPercentage(1.8),
    color: "#6B7280",
  },
  helper: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 6,
  },
});
