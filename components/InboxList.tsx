import React, { useEffect, useState } from "react";
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  View,
  useWindowDimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import Checkbox from "expo-checkbox";
import { useNavigation } from "@react-navigation/native";
import {
  InboxMessage,
  InboxStackNavigationProp,
  Messages,
  UserRecipient,
} from "../src/navigation/types";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import {
  getMessages,
  getNotifyRecipient,
  sendEmailNotification,
  sendInboxMessage,
} from "../src/utils/pimsApi";
import { useRefreshTrigger } from "../hooks/useRefreshTrigger";

export default function InboxList() {
  const { userData, loggedInUser } = useAuth();
  const navigation = useNavigation<InboxStackNavigationProp<"InboxList">>();
  const [modalVisible, setModalVisible] = useState(false);
  const [allRecipients, setAllRecipients] = useState<UserRecipient[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(
    []
  );
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [formError, setFormError] = useState<{
    subject?: string;
    messageBody?: string;
  }>({});

  const [messages, setMessages] = useState<Messages[] | null>(null);
  const [selectedTab, setSelectedTab] = useState<"received" | "sent">(
    "received"
  );
  const [isScrollable, setIsScrollable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const fetchData = async () => {
    if (!userData?.authToken || !userData?.accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const messages = await getMessages(
        userData.authToken,
        userData.accountId
      );
      setMessages(messages);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const receivedCount = messages?.filter((msg) => msg.fromPIMS).length || 0;
  const sentCount = messages?.filter((msg) => !msg.fromPIMS).length || 0;

  const { refreshTrigger, refreshing, onRefresh } =
    useRefreshTrigger(fetchData);

  useEffect(() => {
    const fetchRecipients = async () => {
      if (!userData?.authToken || !userData?.accountId) return;

      try {
        const result = await getNotifyRecipient(
          userData.authToken,
          userData.accountId
        );

        if (result && result.length > 0) {
          const convertedRecipients: UserRecipient[] = result.map((r) => ({
            id: r.id,
            name: r.name,
            emailAddress: r.emailAddress,
          }));

          setAllRecipients(convertedRecipients);

          setSelectedRecipientIds(convertedRecipients.map((r) => r.id));
        }
      } catch (err) {
        console.error("Failed to fetch recipients:", err);
      }
    };

    fetchRecipients();
  }, [userData?.authToken, userData?.accountId]);

  useEffect(() => {
    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>New Message</Text>
      </TouchableOpacity>

      <View style={styles.bodySection}>
        <View style={styles.border}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === "received" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("received")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "received" && styles.activeTabText,
                ]}
              >
                Received ({receivedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === "sent" && styles.activeTab]}
              onPress={() => setSelectedTab("sent")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "sent" && styles.activeTabText,
                ]}
              >
                Sent ({sentCount})
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <Text style={styles.loader}>Loading...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              data={
                messages?.filter((msg) =>
                  selectedTab === "received" ? msg.fromPIMS : !msg.fromPIMS
                ) || []
              }
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() =>
                    navigation.navigate("InboxDetail", {
                      queryId: item.id,
                      title: item.description,
                    })
                  }
                >
                  <Text style={styles.title}>{item.description}</Text>
                  <Text style={styles.date}>
                    {new Date(item.uploadedDate).toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              )}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onContentSizeChange={(_, contentHeight) => {
                setIsScrollable(contentHeight > height);
              }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: isScrollable ? height * 0.22 : 0,
              }}
              ListEmptyComponent={() => (
                <Text style={styles.noData}>No messages available</Text>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>New Message</Text>

                <Text style={styles.label}>Notify To:</Text>
                {allRecipients.map((recipient) => (
                  <View key={recipient.id} style={styles.checkboxContainer}>
                    <Checkbox
                      style={styles.checkbox}
                      value={selectedRecipientIds.includes(recipient.id)}
                      onValueChange={(isChecked) => {
                        setSelectedRecipientIds((prev) =>
                          isChecked
                            ? [...prev, recipient.id]
                            : prev.filter((id) => id !== recipient.id)
                        );
                      }}
                      color={
                        selectedRecipientIds.includes(recipient.id)
                          ? "#1B77BE"
                          : undefined
                      }
                    />

                    <Text style={styles.recipientText}>
                      {recipient.name} &lt;{recipient.emailAddress}&gt;
                    </Text>
                  </View>
                ))}
                {allRecipients.length === 0 && (
                  <Text style={styles.recipientText}>
                    No recipients available
                  </Text>
                )}

                <TextInput
                  placeholder="Name (optional)"
                  style={styles.input}
                  value={newRecipientName}
                  onChangeText={setNewRecipientName}
                />

                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  value={newRecipientEmail}
                  onChangeText={setNewRecipientEmail}
                />

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={() => {
                    if (newRecipientEmail.trim()) {
                      const newId = Date.now().toString();
                      const newRecipient = {
                        id: newId,
                        name: newRecipientName.trim(),
                        emailAddress: newRecipientEmail.trim(),
                      };

                      setAllRecipients((prev) => [...prev, newRecipient]);
                      setSelectedRecipientIds((prev) => [...prev, newId]);
                      setNewRecipientName("");
                      setNewRecipientEmail("");
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>Add Recipient</Text>
                </TouchableOpacity>

                <TextInput
                  placeholder="Subject"
                  style={styles.input}
                  value={subject}
                  onChangeText={(text) => {
                    setSubject(text);
                    if (text.trim())
                      setFormError((prev) => ({ ...prev, subject: "" }));
                  }}
                />
                {formError?.subject ? (
                  <Text style={styles.formError}>{formError.subject}</Text>
                ) : null}

                <TextInput
                  placeholder="Message"
                  style={[styles.input, { height: height * 0.1 }]}
                  value={messageBody}
                  onChangeText={(text) => {
                    setMessageBody(text);
                    if (text.trim())
                      setFormError((prev) => ({ ...prev, messageBody: "" }));
                  }}
                  multiline
                />
                {formError?.messageBody ? (
                  <Text style={styles.formError}>{formError.messageBody}</Text>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.sendButton]}
                    onPress={async () => {
                      let errorObj: { subject?: string; messageBody?: string } =
                        {};

                      if (!subject.trim()) {
                        errorObj.subject = "Subject is required.";
                      }

                      if (!messageBody.trim()) {
                        errorObj.messageBody = "Message is required.";
                      }

                      if (Object.keys(errorObj).length > 0) {
                        setFormError(errorObj);
                        return;
                      }

                      if (
                        !userData?.authToken ||
                        !userData?.accountId ||
                        !loggedInUser?.userId
                      ) {
                        setFormError({
                          subject: "User session invalid.",
                        });
                        return;
                      }

                      const selectedRecipients = allRecipients.filter((r) =>
                        selectedRecipientIds.includes(r.id)
                      );

                      const recipientPayload = selectedRecipients.map((r) => ({
                        DisplayName: r.name || r.emailAddress,
                        EmailAddress: r.emailAddress,
                        Type: "TO",
                      }));

                      if (recipientPayload.length === 0) {
                        setFormError({
                          subject: "Please select at least one recipient.",
                        });
                        return;
                      }

                      try {
                        const payload: InboxMessage = {
                          Description: subject.trim(),
                          Message: messageBody.trim(),
                          Date: new Date().toISOString(),
                          UserId: loggedInUser?.userId || "",
                          Attachments: [],
                        };

                        await sendInboxMessage(
                          userData.authToken,
                          userData.accountId,
                          payload
                        );

                        await sendEmailNotification(
                          userData.authToken,
                          userData.accountId,
                          subject.trim(),
                          messageBody.trim(),
                          recipientPayload
                        );

                        setSubject("");
                        setMessageBody("");
                        setFormError({});
                        setModalVisible(false);
                        fetchData();
                      } catch (error) {
                        console.error("Failed to send message:", error);
                        setFormError({
                          subject: "Failed to send message. Please try again.",
                        });
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Send</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: height * 0.02,
    },
    bodySection: {
      backgroundColor: "#fff",
      borderRadius: 6,
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      paddingHorizontal: height * 0.01,
    },
    button: {
      width: width * 0.4,
      height: height * 0.05,
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.007,
      paddingHorizontal: width * 0.04,
      marginBottom: height * 0.01,
      borderRadius: 6,
      alignSelf: "flex-end",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    tabContainer: {
      flexDirection: "row",
      marginTop: height * 0.01,
    },
    tab: {
      flex: 1,
      padding: 12,
      backgroundColor: "#fff",
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: "#1B77BE",
    },
    tabText: {
      fontSize: RFPercentage(2.2),
      fontWeight: "600",
      color: "#1B77BE",
    },
    activeTabText: {
      color: "#fff",
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      textAlign: "center",
      marginTop: height * 0.3,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    item: {
      paddingVertical: height * 0.01,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
    },
    title: {
      fontSize: RFPercentage(2.5),
      fontWeight: "600",
      color: "#1B77BE",
    },
    date: {
      fontSize: RFPercentage(2),
      color: "#555",
      marginTop: 4,
    },
    noData: {
      textAlign: "center",
      marginVertical: height * 0.02,
      color: "#888",
      fontSize: RFPercentage(2),
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 20,
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 20,
    },
    modalTitle: {
      fontSize: RFPercentage(2.8),
      fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: 16,
      textAlign: "center",
    },
    label: {
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    recipientText: {
      //marginBottom: 8,
      fontSize: RFPercentage(2),
      //color: "#333",
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      //marginBottom: 5,
    },
    checkbox: {
      margin: 8,
    },
    addButton: {
      backgroundColor: "#1B77BE",
      marginBottom: height * 0.02,
    },
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 6,
      padding: 12,
      marginBottom: height * 0.01,
      fontSize: RFPercentage(2),
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalButton: {
      padding: 12,
      borderRadius: 10,
      width: "48%",
      alignItems: "center",
    },
    sendButton: {
      backgroundColor: "#1B77BE",
    },
    closeButton: {
      backgroundColor: "#ccc",
    },
    modalButtonText: {
      color: "white",
      fontSize: RFPercentage(2),
      fontWeight: "bold",
    },
    formError: {
      color: "red",
      fontSize: RFPercentage(2),
      marginBottom: 8,
      marginTop: -8,
    },
  });
