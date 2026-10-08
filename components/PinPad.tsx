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

type PinPadProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

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
          <ActivityIndicator size="small" color="#00205A" />
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

      <View style={styles.keypad}>
        {KEYS.map((key, i) => {
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
                  color="#00205A"
                />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) => {
  const keySize = Math.min(width * 0.2, height * 0.1, 80);

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
      borderColor: "#00205A",
      marginHorizontal: 8,
    },
    dotFilled: {
      backgroundColor: "#00205A",
    },
    dotError: {
      borderColor: "#ff4444",
      backgroundColor: "#ff4444",
    },
    keypad: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      width: keySize * 3 + 60,
    },
    key: {
      width: keySize,
      height: keySize,
      margin: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    digitKey: {
      borderRadius: keySize / 2,
      backgroundColor: "#f1f4f9",
    },
    keyText: {
      fontSize: RFPercentage(3.5),
      color: "#00205A",
      fontWeight: "600",
    },
  });
};
