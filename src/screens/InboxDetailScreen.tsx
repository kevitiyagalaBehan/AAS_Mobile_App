import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { InboxRouteProp } from "../navigation/types";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../context/AuthContext";
import { loadComments, sendComment, deleteComment } from "../utils/pimsApi";
import { Comments } from "../navigation/types";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function InboxDetail() {
  const { userData, loggedInUser } = useAuth();
  const route = useRoute<InboxRouteProp<"InboxDetail">>();
  const navigation = useNavigation();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comments[]>([]);
  const [sending, setSending] = useState(false);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const messageId = route.params.queryId;

  if (!userData) {
    return null;
  }

  const fetchComments = async () => {
    if (!userData?.authToken || !userData?.accountId || !messageId) return;

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
    }
  };

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "android" ? "padding" : undefined}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentList}
        renderItem={({ item }) => {
          const isSent = item.author === loggedInUser?.fullName;

          return (
            <View
              style={[
                styles.comment,
                isSent ? styles.sentComment : styles.receivedComment,
              ]}
            >
              {isSent && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Delete Comment",
                      "Are you sure you want to delete this comment?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          onPress: () => handleDelete(item.id),
                          style: "destructive",
                        },
                      ]
                    )
                  }
                  style={styles.deleteIcon}
                >
                  <FontAwesome name="trash" size={18} color="red" />
                </TouchableOpacity>
              )}

              {!isSent && <Text style={styles.author}>{item.author}</Text>}
              <Text style={styles.text}>{item.comment}</Text>
              <Text style={styles.date}>
                {new Date(item.date).toLocaleString("en-AU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {sending ? "Sending..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    commentList: {
      padding: width * 0.02,
    },
    comment: {
      maxWidth: "80%",
      padding: 10,
      borderRadius: 10,
      marginBottom: height * 0.015,
    },
    sentComment: {
      alignSelf: "flex-end",
      backgroundColor: "#CDEBFA",
      borderTopRightRadius: 0,
    },
    receivedComment: {
      alignSelf: "flex-start",
      backgroundColor: "#fff",
      borderTopLeftRadius: 0,
    },
    author: {
      fontWeight: "bold",
      fontSize: RFPercentage(2.2),
      color: "#1B77BE",
    },
    text: {
      fontSize: RFPercentage(2),
      marginVertical: 4,
      color: "#000",
    },
    date: {
      fontSize: RFPercentage(1.8),
      color: "#888",
    },
    deleteIcon: {
      position: "absolute",
      top: 13,
      right: 7,
      zIndex: 1,
      padding: 4,
    },
    inputContainer: {
      borderTopWidth: 1,
      borderColor: "#ccc",
      padding: width * 0.02,
      backgroundColor: "#f9f9f9",
    },
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      padding: 10,
      fontSize: RFPercentage(2),
      marginBottom: 10,
      backgroundColor: "#fff",
    },
    button: {
      backgroundColor: "#00205A",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
    },
  });
