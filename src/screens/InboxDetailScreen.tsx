import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { InboxRouteProp } from "../navigation/types";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../context/AuthContext";
import { loadComments, sendComment, deleteComment } from "../utils/pimsApi";
import { Comments } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { colors } from "../theme/colors";

type ChatListItem =
  | { type: "day"; key: string; label: string }
  | { type: "comment"; key: string; comment: Comments };

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getDayLabel = (date: Date) => {
  const daysAgo = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86400000
  );
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Oldest-to-newest comments with a day header before each new day, returned
// newest-first because the list is inverted (so it opens at the latest message)
const buildChatItems = (comments: Comments[]): ChatListItem[] => {
  const sorted = [...comments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const items: ChatListItem[] = [];
  let currentDay = "";

  sorted.forEach((comment) => {
    const date = new Date(comment.date);
    const dayKey = startOfDay(date).toISOString();
    if (dayKey !== currentDay) {
      currentDay = dayKey;
      items.push({ type: "day", key: `day-${dayKey}`, label: getDayLabel(date) });
    }
    items.push({ type: "comment", key: comment.id, comment });
  });

  return items.reverse();
};

export default function InboxDetail() {
  const { userData, loggedInUser } = useAuth();
  const route = useRoute<InboxRouteProp<"InboxDetail">>();
  const navigation = useNavigation();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comments[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const styles = getStyles(width, height);

  const messageId = route.params.queryId;

  const fetchComments = async () => {
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
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (commentId: string) =>
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => handleDelete(commentId),
          style: "destructive",
        },
      ]
    );

  const handleSend = async () => {
    if (!newComment.trim()) return;

    if (!userData?.authToken || !userData?.accountId) return;

    setSending(true);

    const success = await sendComment(
      userData.authToken,
      userData.accountId,
      messageId,
      newComment.trim(),
      loggedInUser?.userId || ""
    );

    if (success) {
      setNewComment("");
      fetchComments();
    } else {
      Alert.alert("Error", "Failed to send comment.");
    }

    setSending(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!userData?.authToken || !userData?.accountId) return;

    try {
      const response = await deleteComment(
        userData.authToken,
        userData.accountId,
        commentId
      );

      if (response) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        Alert.alert("Error", "Failed to delete comment.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [userData?.authToken, userData?.accountId, messageId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: route.params.title });
  }, [navigation, route.params.title]);

  if (!userData) {
    return null;
  }

  const canSend = newComment.trim().length > 0 && !sending;
  const chatItems = buildChatItems(comments);

  const renderChatItem = ({ item }: { item: ChatListItem }) => {
    if (item.type === "day") {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{item.label}</Text>
        </View>
      );
    }

    const { comment } = item;
    const isSent = comment.author === loggedInUser?.fullName;

    return (
      <Pressable
        onLongPress={isSent ? () => confirmDelete(comment.id) : undefined}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.comment,
          isSent ? styles.sentComment : styles.receivedComment,
          pressed && isSent && styles.commentPressed,
        ]}
        accessibilityHint={isSent ? "Long press to delete" : undefined}
      >
        {!isSent && <Text style={styles.author}>{comment.author}</Text>}
        <Text style={[styles.text, isSent && styles.sentText]}>
          {comment.comment}
        </Text>
        <Text style={[styles.date, isSent && styles.sentDate]}>
          {new Date(comment.date).toLocaleTimeString("en-AU", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      </Pressable>
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
      ) : comments.length === 0 ? (
        // Kept outside the FlatList: an inverted list renders its empty
        // component upside down
        <View style={styles.centerState}>
          <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Write a comment below to start the conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatItems}
          inverted
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.commentList}
          renderItem={renderChatItem}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, width * 0.02) },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          placeholderTextColor="#9CA3AF"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.button, !canSend && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F3F4F6",
    },
    commentList: {
      padding: width * 0.03,
    },
    centerState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: width * 0.1,
    },
    emptyTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: height * 0.01,
    },
    emptyText: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      textAlign: "center",
      marginTop: 4,
    },
    dayHeader: {
      alignSelf: "center",
      backgroundColor: "#E5E7EB",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginVertical: height * 0.01,
    },
    dayHeaderText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "600",
      color: "#4B5563",
    },
    comment: {
      maxWidth: "80%",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      marginBottom: height * 0.01,
    },
    sentComment: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    receivedComment: {
      alignSelf: "flex-start",
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderBottomLeftRadius: 4,
    },
    commentPressed: {
      opacity: 0.7,
    },
    author: {
      fontWeight: "bold",
      fontSize: RFPercentage(1.8),
      color: colors.primary,
      marginBottom: 2,
    },
    text: {
      fontSize: RFPercentage(2),
      color: "#111827",
    },
    sentText: {
      color: "#fff",
    },
    date: {
      fontSize: RFPercentage(1.5),
      color: "#6B7280",
      alignSelf: "flex-end",
      marginTop: 4,
    },
    sentDate: {
      color: "#C9D3E6",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      borderTopWidth: 1,
      borderColor: "#ccc",
      paddingTop: width * 0.02,
      paddingHorizontal: width * 0.02,
      backgroundColor: "#f9f9f9",
    },
    input: {
      flex: 1,
      maxHeight: height * 0.15,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: RFPercentage(2),
      backgroundColor: "#fff",
      marginRight: width * 0.02,
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonDisabled: {
      opacity: 0.4,
    },
  });
