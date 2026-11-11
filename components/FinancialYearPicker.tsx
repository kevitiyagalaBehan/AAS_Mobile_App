import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { FinancialYear } from "../src/navigation/types";
import { formatFinancialYear } from "../src/utils/format";
import { colors } from "../src/theme/colors";

type FinancialYearPickerProps = {
  years: FinancialYear[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// "Financial year" dropdown button that opens a bottom sheet of years
export default function FinancialYearPicker({
  years,
  selectedId,
  onSelect,
}: FinancialYearPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = years.find((y) => y.id === selectedId);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen(true)}
        disabled={years.length === 0}
        accessibilityRole="button"
        accessibilityLabel="Select financial year"
      >
        <Ionicons name="calendar-outline" size={RFPercentage(2.6)} color={colors.primary} />
        <View style={styles.textBox}>
          <Text style={styles.label}>Financial year</Text>
          <Text style={styles.value}>{selected ? formatFinancialYear(selected) : "—"}</Text>
        </View>
        <Ionicons name="chevron-down" size={RFPercentage(2.4)} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <Text style={styles.sheetTitle}>Financial year</Text>
          <ScrollView>
            {years.map((y) => {
              const isSelected = y.id === selectedId;
              return (
                <TouchableOpacity
                  key={y.id}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => {
                    onSelect(y.id);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.optionText}>
                    {formatFinancialYear(y)}
                    {y.isCurrent ? "  (current)" : ""}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={RFPercentage(2.6)} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textBox: {
    flex: 1,
    marginLeft: 10,
  },
  label: {
    fontSize: RFPercentage(1.6),
    color: "#6B7280",
  },
  value: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 8,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: RFPercentage(2.1),
    fontWeight: "bold",
    color: colors.primary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontSize: RFPercentage(2),
    color: colors.primary,
  },
});
