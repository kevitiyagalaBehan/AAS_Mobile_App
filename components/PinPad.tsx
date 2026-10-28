import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { colors } from "../src/theme/colors";

type PinPadProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
};

// Explicit rows rather than one wrapping row: a wrap width that exactly fits three keys
// can round a fraction of a pixel short on some screens and drop to two columns.
const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "back"],
];

export default function PinPad({
  length,
  value,
  onChange,
  disabled = false,
  loading = false,
  error = false,
}: PinPadProps) {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const handlePress = (key: string) => {
    if (disabled || loading) return;

    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }

    if (value.length < length) {
      onChange(value + key);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.dotsRow}
        accessible
        accessibilityLabel={`${value.length} of ${length} digits entered`}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          Array.from({ length }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < value.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))
        )}
      </View>

      {ROWS.map((row, r) => (
        <View key={r} style={styles.keyRow}>
          {row.map((key, i) => {
            if (key === "") {
              return <View key={i} style={styles.key} />;
            }

            const isBack = key === "back";

            return (
              <TouchableOpacity
                key={i}
                style={[styles.key, !isBack && styles.digitKey]}
                onPress={() => handlePress(key)}
                disabled={disabled || loading || (isBack && value.length === 0)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={isBack ? "Delete" : key}
              >
                {isBack ? (
                  <Ionicons
                    name="backspace-outline"
                    size={RFPercentage(3.5)}
                    color={colors.primary}
                  />
                ) : (
                  <Text style={styles.keyText} maxFontSizeMultiplier={1.2}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const getStyles = (width: number, height: number) => {
  const keySize = Math.floor(Math.min(width * 0.2, height * 0.09, 80));

  return StyleSheet.create({
    container: {
      alignItems: "center",
      width: "100%",
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      height: 24,
      marginBottom: height * 0.03,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      marginHorizontal: 8,
    },
    dotFilled: {
      backgroundColor: colors.primary,
    },
    dotError: {
      borderColor: "#ff4444",
      backgroundColor: "#ff4444",
    },
    keyRow: {
      flexDirection: "row",
      justifyContent: "center",
    },
    key: {
      width: keySize,
      height: keySize,
      margin: Math.min(10, width * 0.025),
      justifyContent: "center",
      alignItems: "center",
    },
    digitKey: {
      borderRadius: keySize / 2,
      backgroundColor: "#f1f4f9",
    },
    keyText: {
      fontSize: RFPercentage(3.5),
      color: colors.primary,
      fontWeight: "600",
    },
  });
};
