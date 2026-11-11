import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { formatShortDate } from "../src/utils/format";
import { colors } from "../src/theme/colors";

type PickerTarget = "from" | "to";

type DateRangePickerProps = {
  from: Date;
  to: Date;
  onChangeFrom: (date: Date) => void;
  onChangeTo: (date: Date) => void;
};

// From / To date buttons. Android uses the system dialog; iOS edits a draft
// in a bottom sheet and only applies it on Done.
export default function DateRangePicker({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: DateRangePickerProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const today = new Date();

  const openPicker = (target: PickerTarget) => {
    setDraftDate(target === "from" ? from : to);
    setPickerTarget(target);
  };

  const applyDate = (target: PickerTarget, date: Date) => {
    if (target === "from") onChangeFrom(date);
    else onChangeTo(date);
  };

  // From can't go past To; To can't be before From or in the future
  const pickerLimits =
    pickerTarget === "from"
      ? { maximumDate: to }
      : { minimumDate: from, maximumDate: today };

  const renderDateButton = (target: PickerTarget, label: string, date: Date) => (
    <TouchableOpacity
      style={styles.dateButton}
      onPress={() => openPicker(target)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label} date, ${formatShortDate(date)}`}
    >
      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      <View style={styles.dateTextBox}>
        <Text style={styles.dateLabel}>{label}</Text>
        <Text style={styles.dateValue} numberOfLines={1}>
          {formatShortDate(date)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.dateRow}>
        {renderDateButton("from", "From", from)}
        {renderDateButton("to", "To", to)}
      </View>

      {pickerTarget && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerTarget === "from" ? from : to}
          mode="date"
          display="default"
          {...pickerLimits}
          onChange={(event, date) => {
            const target = pickerTarget;
            setPickerTarget(null);
            if (event.type === "set" && date) applyDate(target, date);
          }}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={!!pickerTarget}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerTarget(null)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setPickerTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setPickerTarget(null)} hitSlop={10}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>
                {pickerTarget === "from" ? "From date" : "To date"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (pickerTarget) applyDate(pickerTarget, draftDate);
                  setPickerTarget(null);
                }}
                hitSlop={10}
              >
                <Text style={styles.sheetDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {pickerTarget && (
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="inline"
                themeVariant="light"
                accentColor={colors.primary}
                {...pickerLimits}
                onChange={(_, date) => date && setDraftDate(date)}
              />
            )}
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateTextBox: {
    flex: 1,
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: RFPercentage(1.6),
    color: "#6B7280",
  },
  dateValue: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  sheetTitle: {
    fontSize: RFPercentage(2.1),
    fontWeight: "bold",
    color: colors.primary,
  },
  sheetCancel: {
    fontSize: RFPercentage(2),
    color: "#6B7280",
  },
  sheetDone: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.link,
  },
});
