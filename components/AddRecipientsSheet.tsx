import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserRecipient } from "../src/navigation/types";
import { getInitials } from "./UserAvatar";
import { colors } from "../src/theme/colors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AddRecipientsSheetProps = {
  visible: boolean;
  fundContacts: UserRecipient[];
  // Everyone currently on the message, including people added by email
  selected: UserRecipient[];
  onDone: (selected: UserRecipient[]) => void;
  onCancel: () => void;
};

export default function AddRecipientsSheet({
  visible,
  fundContacts,
  selected,
  onDone,
  onCancel,
}: AddRecipientsSheetProps) {
  // Edits are kept here until Done, so Back discards them
  const [draft, setDraft] = useState<UserRecipient[]>(selected);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setQuery("");
      setNewName("");
      setNewEmail("");
      setEmailTouched(false);
    }
  }, [visible]);

  const isSelected = (r: UserRecipient) =>
    draft.some((d) => d.emailAddress === r.emailAddress);

  const toggle = (r: UserRecipient) =>
    setDraft((prev) =>
      isSelected(r)
        ? prev.filter((d) => d.emailAddress !== r.emailAddress)
        : [...prev, r]
    );

  // People added by email show in the list too, so they can be unticked
  const extras = draft.filter(
    (d) => !fundContacts.some((c) => c.emailAddress === d.emailAddress)
  );
  const search = query.trim().toLowerCase();
  const listed = [...fundContacts, ...extras].filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search) ||
      r.emailAddress.toLowerCase().includes(search)
  );

  const email = newEmail.trim();
  const emailValid = EMAIL_PATTERN.test(email);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;

  const addNew = () => {
    setEmailTouched(true);
    if (!emailValid) return;
    const recipient = {
      id: `new-${email}`,
      name: newName.trim(),
      emailAddress: email,
    };
    if (!isSelected(recipient)) setDraft((prev) => [...prev, recipient]);
    setNewName("");
    setNewEmail("");
    setEmailTouched(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerSide}
            onPress={onCancel}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add recipients</Text>
          <View style={[styles.headerSide, styles.headerRight]}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => onDone(draft)}
              accessibilityRole="button"
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name or email"
                placeholderTextColor="#6B7280"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.sectionLabel}>ON THIS FUND</Text>
            {listed.length === 0 ? (
              <Text style={styles.muted}>
                {search ? "No matches" : "No contacts on this fund"}
              </Text>
            ) : (
              listed.map((r, i) => {
                const checked = isSelected(r);
                return (
                  <TouchableOpacity
                    key={r.emailAddress}
                    style={[styles.contactRow, i > 0 && styles.divider]}
                    onPress={() => toggle(r)}
                    activeOpacity={0.6}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitials(r.name || r.emailAddress) || "?"}
                      </Text>
                    </View>
                    <View style={styles.contactText}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {r.name || r.emailAddress}
                      </Text>
                      {!!r.name && (
                        <Text style={styles.contactEmail} numberOfLines={1}>
                          {r.emailAddress}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                      {checked && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={styles.newSection}>
              <Text style={styles.sectionLabel}>SOMEONE NEW</Text>
              <Text style={styles.fieldLabel}>
                Name <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                autoCapitalize="words"
              />
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, showEmailError && styles.inputError]}
                value={newEmail}
                onChangeText={setNewEmail}
                onBlur={() => setEmailTouched(true)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {showEmailError && (
                <Text style={styles.errorText}>
                  Enter a full email address, like name@company.com.au
                </Text>
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addNew}
                accessibilityRole="button"
              >
                <Text style={styles.addText}>Add to message</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    justifyContent: "flex-end",
  },
  backText: {
    fontSize: RFPercentage(2),
    color: colors.primary,
  },
  headerTitle: {
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    color: colors.primary,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  doneText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: RFPercentage(1.9),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF0F4",
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: RFPercentage(2),
    color: "#111827",
  },
  sectionLabel: {
    fontSize: RFPercentage(1.6),
    fontWeight: "bold",
    color: "#6B7280",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  muted: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "bold",
    color: colors.primary,
    fontSize: RFPercentage(1.8),
  },
  contactText: {
    flex: 1,
    marginHorizontal: 12,
  },
  contactName: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: "#111827",
  },
  contactEmail: {
    fontSize: RFPercentage(1.7),
    color: "#4B5563",
    marginTop: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  newSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: RFPercentage(1.8),
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  optional: {
    fontWeight: "normal",
    color: "#6B7280",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: RFPercentage(2),
    color: "#111827",
  },
  inputError: {
    borderColor: "#B45309",
  },
  errorText: {
    color: "#B45309",
    fontSize: RFPercentage(1.6),
    paddingHorizontal: 16,
    marginTop: 4,
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  addText: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
});
