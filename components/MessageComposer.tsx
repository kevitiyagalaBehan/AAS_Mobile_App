import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../src/theme/colors";

type MessageComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

// iMessage-style input bar: rounded field with a round send arrow
export default function MessageComposer({
  value,
  onChangeText,
  onSend,
  disabled,
  autoFocus,
}: MessageComposerProps) {
  const insets = useSafeAreaInsets();
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <TextInput
        style={styles.input}
        placeholder="Message"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        multiline
        autoFocus={autoFocus}
      />
      <TouchableOpacity
        style={[styles.send, canSend ? styles.sendReady : styles.sendIdle]}
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send"
        accessibilityState={{ disabled: !canSend }}
      >
        <Ionicons name="arrow-up" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: RFPercentage(2),
    color: "#111827",
    marginRight: 8,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
  sendReady: {
    backgroundColor: colors.primary,
  },
  sendIdle: {
    backgroundColor: "#C4CAD4",
  },
});
