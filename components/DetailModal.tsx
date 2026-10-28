import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";

export type DetailRow = { label: string; value?: string | null };

type DetailModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  rows: DetailRow[];
  onClose: () => void;
};

// Label/value popup used by the redesigned list cards
export default function DetailModal({
  visible,
  title,
  subtitle,
  rows,
  onClose,
}: DetailModalProps) {
  const { width } = useWindowDimensions();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.content, { width: width * 0.85, padding: width * 0.05 }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {rows.map((row, idx) => (
            <View
              key={row.label}
              style={[styles.row, idx === rows.length - 1 && styles.lastRow]}
            >
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value || "N/A"}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    backgroundColor: "white",
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: RFPercentage(2.5),
    fontWeight: "bold",
    color: colors.primary,
  },
  subtitle: {
    fontSize: RFPercentage(1.8),
    color: "#6B7280",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
    fontSize: RFPercentage(1.9),
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: RFPercentage(2),
  },
});
