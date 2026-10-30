import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { InboxRouteProp, Comments } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { loadComments, sendComment, deleteComment } from "../utils/pimsApi";
import { isOwnComment, markThreadSeen } from "../utils/messageThreads";
import { formatBubbleDay, formatTime, isSameDay } from "../utils/messageFormat";
import { MessageComposer } from "../../components";
import { colors } from "../theme/colors";

// Check for replies while the conversation is open
const POLL_MS = 15000;
// Gap after which a bubble starts a new group (shows its own name/time)
const GROUP_GAP_MS = 5 * 60 * 1000;

type Bubble = {
  key: string;
  text: string;
  date: number;
  author: string;
  mine: boolean;
  status: "sent" | "sending" | "failed";
  commentId?: string;
};

type ChatItem =
  | { type: "day"; key: string; label: string }
  | { type: "bubble"; key: string; bubble: Bubble; showName: boolean; showTime: boolean };

// Oldest-first bubbles with a day label before each new day, returned newest-first
// because the list is inverted (so it opens at the latest message)
const buildItems = (bubbles: Bubble[]): ChatItem[] => {
  const items: ChatItem[] = [];
  bubbles.forEach((bubble, i) => {
    const prev = bubbles[i - 1];
    const next = bubbles[i + 1];
    if (!prev || !isSameDay(prev.date, bubble.date)) {
      items.push({
        type: "day",
        key: `day-${bubble.key}`,
        label: `${formatBubbleDay(bubble.date)} ${formatTime(bubble.date)}`,
      });
    }
    const startsGroup =
      !prev ||
      prev.author !== bubble.author ||
      bubble.date - prev.date > GROUP_GAP_MS ||
      !isSameDay(prev.date, bubble.date);
    const endsGroup =
      !next ||
      next.author !== bubble.author ||
      next.date - bubble.date > GROUP_GAP_MS ||
      !isSameDay(next.date, bubble.date);
    items.push({
      type: "bubble",
      key: bubble.key,
      bubble,
      showName: !bubble.mine && startsGroup,
      showTime: endsGroup || bubble.status !== "sent",
    });
  });
  return items.reverse();
};

export default function InboxDetail() {
  const { userData, loggedInUser } = useAuth();
  const route = useRoute<InboxRouteProp<"InboxDetail">>();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [comments, setComments] = useState<Comments[]>([]);
  // Messages typed here that the server hasn't returned yet
  const [pending, setPending] = useState<Bubble[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const pendingId = useRef(0);

  const messageId = route.params.queryId;
  const myName = loggedInUser?.fullName;

  const fetchComments = useCallback(async () => {
    if (!userData?.authToken || !userData?.accountId || !messageId) {
      setLoading(false);
      return;
    }
    try {
      const response = await loadComments(
        userData.authToken,
        userData.accountId,
        messageId
      );
      if (response) {
        setComments(response);
        const latest = Math.max(
          0,
          ...response.map((c) => new Date(c.date).getTime())
        );
        if (latest) markThreadSeen(userData.accountId, messageId, latest);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  }, [userData?.authToken, userData?.accountId, messageId]);

  useFocusEffect(
    useCallback(() => {
      fetchComments();
      const timer = setInterval(fetchComments, POLL_MS);
      return () => clearInterval(timer);
    }, [fetchComments])
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: route.params.title });
  }, [navigation, route.params.title]);

  const deliver = async (bubble: Bubble) => {
    if (!userData?.authToken || !userData?.accountId) return;
    setPending((prev) =>
      prev.map((p) => (p.key === bubble.key ? { ...p, status: "sending" } : p))
    );

    const ok = await sendComment(
      userData.authToken,
      userData.accountId,
      messageId,
      bubble.text,
      loggedInUser?.userId || ""
    );

    if (ok) {
      await fetchComments();
      setPending((prev) => prev.filter((p) => p.key !== bubble.key));
    } else {
      setPending((prev) =>
        prev.map((p) => (p.key === bubble.key ? { ...p, status: "failed" } : p))
      );
    }
  };

  const handleSend = () => {
    const body = text.trim();
    if (!body) return;
    pendingId.current += 1;
    const bubble: Bubble = {
      key: `pending-${pendingId.current}`,
      text: body,
      date: Date.now(),
      author: myName ?? "",
      mine: true,
      status: "sending",
    };
    setPending((prev) => [...prev, bubble]);
    setText("");
    deliver(bubble);
  };

  const handleDelete = async (commentId: string) => {
    if (!userData?.authToken || !userData?.accountId) return;
    const ok = await deleteComment(
      userData.authToken,
      userData.accountId,
      commentId
    );
    if (ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      Alert.alert("Couldn't delete", "Please try again.");
    }
  };

  const onLongPress = (bubble: Bubble) => {
    if (bubble.status === "failed") {
      Alert.alert("Not delivered", bubble.text, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setPending((prev) => prev.filter((p) => p.key !== bubble.key)),
        },
        { text: "Try Again", onPress: () => deliver(bubble) },
      ]);
      return;
    }
    if (bubble.mine && bubble.commentId) {
      const id = bubble.commentId;
      Alert.alert("Delete message?", "This removes it for everyone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
      ]);
    }
  };

  if (!userData) {
    return null;
  }

  const bubbles: Bubble[] = [
    ...[...comments]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(
        (c): Bubble => ({
          key: c.id,
          text: c.comment,
          date: new Date(c.date).getTime(),
          author: c.author,
          mine: isOwnComment(c, myName),
          status: "sent",
          commentId: c.id,
        })
      ),
    ...pending,
  ];
  const items = buildItems(bubbles);

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.type === "day") {
      return <Text style={styles.dayLabel}>{item.label}</Text>;
    }

    const { bubble, showName, showTime } = item;
    const failed = bubble.status === "failed";

    return (
      <View style={[styles.bubbleWrap, bubble.mine ? styles.wrapMine : styles.wrapTheirs]}>
        {showName && <Text style={styles.author}>{bubble.author}</Text>}
        <View style={styles.bubbleRow}>
          <Pressable
            onPress={failed ? () => onLongPress(bubble) : undefined}
            onLongPress={() => onLongPress(bubble)}
            delayLongPress={350}
            style={({ pressed }) => [
              styles.bubble,
              bubble.mine ? styles.bubbleMine : styles.bubbleTheirs,
              bubble.status === "sending" && styles.bubbleSending,
              pressed && styles.bubblePressed,
            ]}
            accessibilityHint={
              failed
                ? "Not delivered. Double tap for options"
                : bubble.mine
                ? "Long press to delete"
                : undefined
            }
          >
            <Text style={[styles.text, bubble.mine && styles.textMine]}>
              {bubble.text}
            </Text>
          </Pressable>
          {failed && (
            <Ionicons
              name="alert-circle"
              size={20}
              color="#DC2626"
              style={styles.failedIcon}
            />
          )}
        </View>
        {showTime && (
          <Text style={[styles.meta, failed && styles.metaFailed]}>
            {bubble.status === "sending"
              ? "Sending…"
              : failed
              ? "Not delivered"
              : formatTime(bubble.date)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : bubbles.length === 0 ? (
        // Kept outside the FlatList: an inverted list renders its empty
        // component upside down
        <View style={styles.centerState}>
          <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          inverted
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      <MessageComposer value={text} onChangeText={setText} onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
    marginTop: 8,
  },
  dayLabel: {
    alignSelf: "center",
    fontSize: RFPercentage(1.5),
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 14,
    marginBottom: 6,
  },
  bubbleWrap: {
    maxWidth: "80%",
    marginBottom: 3,
  },
  wrapMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  wrapTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  author: {
    fontSize: RFPercentage(1.5),
    color: "#6B7280",
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
  },
  bubbleTheirs: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bubbleSending: {
    opacity: 0.6,
  },
  bubblePressed: {
    opacity: 0.7,
  },
  failedIcon: {
    marginLeft: 6,
  },
  text: {
    fontSize: RFPercentage(2),
    color: "#111827",
  },
  textMine: {
    color: "#fff",
  },
  meta: {
    fontSize: RFPercentage(1.4),
    color: "#6B7280",
    marginTop: 2,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  metaFailed: {
    color: "#DC2626",
  },
});
