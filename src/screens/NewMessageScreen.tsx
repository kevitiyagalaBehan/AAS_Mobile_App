import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../context/AuthContext";
import {
  getMessages,
  getNotifyRecipient,
  sendEmailNotification,
  sendInboxMessage,
} from "../utils/pimsApi";
import { InboxStackNavigationProp, UserRecipient } from "../navigation/types";
import { AddRecipientsSheet, MessageComposer } from "../../components";
import { colors } from "../theme/colors";

const SUBJECT_LENGTH = 60;

// The API needs a subject; like a text message there isn't one, so use the opening line
const subjectFrom = (text: string) => {
  const firstLine = text.trim().split("\n")[0].trim();
  return firstLine.length > SUBJECT_LENGTH
    ? `${firstLine.slice(0, SUBJECT_LENGTH - 1).trimEnd()}…`
    : firstLine;
};

export default function NewMessageScreen() {
  const { userData, loggedInUser } = useAuth();
  const navigation = useNavigation<InboxStackNavigationProp<"NewMessage">>();
  const headerHeight = useHeaderHeight();
  const [fundContacts, setFundContacts] = useState<UserRecipient[]>([]);
  const [recipients, setRecipients] = useState<UserRecipient[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) return;
      try {
        const result = await getNotifyRecipient(
          userData.authToken,
          userData.accountId
        );
        const contacts = (result ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          emailAddress: r.emailAddress,
        }));
        setFundContacts(contacts);
        // Everyone on the fund is notified by default, as before
        setRecipients(contacts);
      } catch (err) {
        console.error("Failed to fetch recipients:", err);
      } finally {
        setLoadingContacts(false);
      }
    };

    load();
  }, [userData?.authToken, userData?.accountId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;

    if (recipients.length === 0) {
      Alert.alert("Add a recipient", "Tap + to choose who this goes to.");
      return;
    }
    if (!userData?.authToken || !userData?.accountId || !loggedInUser?.userId) {
      Alert.alert("Session expired", "Please log in again to send messages.");
      return;
    }

    const subject = subjectFrom(body);
    setSending(true);
    try {
      await sendInboxMessage(userData.authToken, userData.accountId, {
        Description: subject,
        Message: body,
        Date: new Date().toISOString(),
        UserId: loggedInUser.userId,
        Attachments: [],
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setSending(false);
      Alert.alert("Not delivered", "Your message wasn't sent. Please try again.");
      return;
    }

    try {
      await sendEmailNotification(
        userData.authToken,
        userData.accountId,
        subject,
        body,
        recipients.map((r) => ({
          DisplayName: r.name || r.emailAddress,
          EmailAddress: r.emailAddress,
          Type: "TO",
        }))
      );
    } catch (error) {
      // The message is saved; only the email alert failed
      console.error("Email notification failed:", error);
    }

    // The send API doesn't return the new thread, so look it up to open it
    try {
      const threads = await getMessages(userData.authToken, userData.accountId);
      const created = (threads ?? [])
        .filter((t) => !t.fromPIMS && t.description === subject)
        .sort((a, b) => b.uploadedDate - a.uploadedDate)[0];
      if (created) {
        navigation.replace("InboxDetail", {
          queryId: created.id,
          title: created.description,
        });
        return;
      }
    } catch {
      // Fall through to the list
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.toRow}>
        <Text style={styles.toLabel}>To:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipScroll}
        >
          {loadingContacts ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            recipients.map((r) => (
              <TouchableOpacity
                key={r.emailAddress}
                style={styles.chip}
                onPress={() =>
                  setRecipients((prev) =>
                    prev.filter((p) => p.emailAddress !== r.emailAddress)
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`Remove ${r.name || r.emailAddress}`}
              >
                <Text style={styles.chipText} numberOfLines={1}>
                  {r.name || r.emailAddress}
                </Text>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Add recipients"
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {sending && (
          <View style={styles.sendingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.sendingText}>Sending…</Text>
          </View>
        )}
      </View>

      <MessageComposer
        value={text}
        onChangeText={setText}
        onSend={send}
        disabled={sending}
        autoFocus
      />

      <AddRecipientsSheet
        visible={pickerVisible}
        fundContacts={fundContacts}
        selected={recipients}
        onCancel={() => setPickerVisible(false)}
        onDone={(selected) => {
          setRecipients(selected);
          setPickerVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  toRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  toLabel: {
    fontSize: RFPercentage(2),
    color: "#4B5563",
    marginRight: 8,
  },
  chipScroll: {
    flex: 1,
  },
  chips: {
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 200,
    gap: 4,
  },
  chipText: {
    fontSize: RFPercentage(1.8),
    color: colors.primary,
    fontWeight: "600",
    flexShrink: 1,
  },
  body: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  sendingRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
  },
  sendingText: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
  },
});
