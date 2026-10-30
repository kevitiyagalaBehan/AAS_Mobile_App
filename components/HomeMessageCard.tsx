import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import { getEsignDocuments, sendComment } from "../src/utils/pimsApi";
import { formatShortDate } from "../src/utils/format";
import { markThreadSeen, ThreadSummary } from "../src/utils/messageThreads";
import { avatarFor, formatThreadDate } from "../src/utils/messageFormat";
import { useMessageThreads } from "../hooks/useMessageThreads";
import { EsignDocument } from "../src/navigation/types";
import { colors } from "../src/theme/colors";
import Card from "./Card";

const formatWhen = (timestamp: number) => {
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
    : formatShortDate(date);
};

// The latest document waiting for signature, and the newest unread message
// (which can be replied to or dismissed right here). Each is hidden when there is none.
export default function HomeMessageCard({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const { userData, loggedInUser } = useAuth();
  const navigation = useNavigation<any>();
  const { threads, reload } = useMessageThreads(refreshTrigger);
  const [toSign, setToSign] = useState<EsignDocument | null>(null);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) return;
      try {
        const documents = await getEsignDocuments(
          userData.authToken,
          userData.accountId
        );
        const latest = (documents || [])
          .filter((doc) =>
            doc.signatories.some((s) => s.esigningStatus !== "Signed")
          )
          .sort(
            (a, b) =>
              new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
          )[0];
        setToSign(latest ?? null);
      } catch {
        setToSign(null);
      }
    };

    load();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  // Clear the "Reply sent" note after a moment
  useEffect(() => {
    if (!sentTo) return;
    const timer = setTimeout(() => setSentTo(null), 3000);
    return () => clearTimeout(timer);
  }, [sentTo]);

  const message = threads.find((t) => t.unread) ?? null;

  // Start fresh when a different message takes the card
  useEffect(() => {
    setReplying(false);
    setReply("");
  }, [message?.id]);

  const openThread = (thread: ThreadSummary) =>
    navigation.navigate("Inbox", {
      screen: "InboxDetail",
      params: { queryId: thread.id, title: thread.subject },
      // Keep the Inbox list underneath so back returns to it
      initial: false,
    });

  const dismiss = (thread: ThreadSummary) => {
    if (userData?.accountId) {
      markThreadSeen(userData.accountId, thread.id, thread.lastDate);
    }
  };

  const sendReply = async (thread: ThreadSummary) => {
    const body = reply.trim();
    if (!body || !userData?.authToken || !userData?.accountId) return;

    setSending(true);
    const ok = await sendComment(
      userData.authToken,
      userData.accountId,
      thread.id,
      body,
      loggedInUser?.userId || ""
    );
    setSending(false);

    if (!ok) {
      Alert.alert("Not delivered", "Your reply wasn't sent. Please try again.");
      return;
    }

    setSentTo(thread.lastAuthor);
    setReplying(false);
    setReply("");
    // Marking it read reloads the threads, which also picks up the reply
    await markThreadSeen(userData.accountId, thread.id, thread.lastDate);
    reload();
  };

  const renderMessage = (thread: ThreadSummary) => {
    const avatar = avatarFor(thread.lastAuthor || "AAS");
    const canSend = reply.trim().length > 0 && !sending;

    return (
      <Card style={styles.messageCard}>
        <TouchableOpacity
          onPress={() => openThread(thread)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`New message from ${thread.lastAuthor}. ${thread.lastText}`}
          accessibilityHint="Opens the conversation"
        >
          <View style={styles.messageHeader}>
            <View>
              <View style={[styles.avatar, { backgroundColor: avatar.color }]}>
                <Text style={styles.avatarText} numberOfLines={1} adjustsFontSizeToFit>
                  {avatar.initials}
                </Text>
              </View>
              <View style={styles.unreadDot} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.newLabel}>New message</Text>
              <Text style={styles.sender} numberOfLines={1}>
                {thread.lastAuthor}
              </Text>
            </View>
            <Text style={styles.time}>{formatThreadDate(thread.lastDate)}</Text>
          </View>
          <Text style={styles.messageText} numberOfLines={4}>
            {thread.lastText}
          </Text>
        </TouchableOpacity>

        {replying ? (
          <View style={styles.replyRow}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Reply to ${thread.lastAuthor}`}
              placeholderTextColor="#9CA3AF"
              value={reply}
              onChangeText={setReply}
              multiline
              autoFocus
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendIdle]}
              onPress={() => sendReply(thread)}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send reply"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => dismiss(thread)}
              hitSlop={8}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityHint="Marks this message as read"
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setReplying(true)}
              style={styles.replyButton}
              accessibilityRole="button"
            >
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <>
      {toSign && (
        <TouchableOpacity
          onPress={() => navigation.navigate("ESigning")}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Card style={styles.signCard}>
            <View style={styles.iconBox}>
              <Ionicons name="create-outline" size={22} color="#C2410C" />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.title} numberOfLines={2}>
                Ready to sign: {toSign.subject}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                From {toSign.sentBy || toSign.companyName || "AAS"} ·{" "}
                {formatWhen(new Date(toSign.sentDate).getTime())}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </Card>
        </TouchableOpacity>
      )}

      {message ? (
        renderMessage(message)
      ) : sentTo ? (
        <Card style={styles.sentCard}>
          <Ionicons name="checkmark-circle" size={20} color="#15803D" />
          <Text style={styles.sentText} numberOfLines={1}>
            Reply sent to {sentTo}
          </Text>
        </Card>
      ) : null}
    </>
  );
}

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  signCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textBox: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  subtitle: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 2,
  },
  messageCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.link,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: RFPercentage(1.9),
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.link,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerText: {
    flex: 1,
    marginHorizontal: 12,
  },
  newLabel: {
    fontSize: RFPercentage(1.6),
    fontWeight: "600",
    color: "#15803D",
  },
  sender: {
    fontSize: RFPercentage(2.1),
    fontWeight: "bold",
    color: colors.primary,
  },
  time: {
    fontSize: RFPercentage(1.7),
    color: "#4B5563",
  },
  messageText: {
    fontSize: RFPercentage(1.9),
    color: "#1F2937",
    marginTop: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
  },
  dismissText: {
    fontSize: RFPercentage(1.9),
    fontWeight: "600",
    color: "#4B5563",
  },
  replyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  replyText: {
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    color: "#fff",
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
  },
  replyInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: RFPercentage(1.9),
    color: "#111827",
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
  sendIdle: {
    backgroundColor: "#C4CAD4",
  },
  sentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sentText: {
    flex: 1,
    fontSize: RFPercentage(1.9),
    fontWeight: "600",
    color: "#15803D",
  },
});
