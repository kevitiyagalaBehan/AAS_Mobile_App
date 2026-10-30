import React, { useCallback, useState } from "react";
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { InboxStackNavigationProp } from "../src/navigation/types";
import {
  loadThreadSummaries,
  markThreadSeen,
  ThreadSummary,
} from "../src/utils/messageThreads";
import { avatarFor, formatThreadDate } from "../src/utils/messageFormat";
import { colors } from "../src/theme/colors";

export default function InboxList() {
  const { userData, loggedInUser } = useAuth();
  const navigation = useNavigation<InboxStackNavigationProp<"InboxList">>();
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userData?.authToken || !userData?.accountId) return;
    try {
      setError(null);
      setThreads(
        await loadThreadSummaries(
          userData.authToken,
          userData.accountId,
          loggedInUser?.fullName
        )
      );
    } catch {
      setError("Failed to load messages");
    }
  }, [userData?.authToken, userData?.accountId, loggedInUser?.fullName]);

  // Reload on return from a conversation so previews and unread dots stay current
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const goHome = () =>
    navigation.navigate("MainTabs" as any, {
      screen:
        userData?.accountType === "Family Group" ? "HomeFamily" : "HomeOther",
    });

  const openThread = (thread: ThreadSummary) => {
    if (userData?.accountId) {
      markThreadSeen(userData.accountId, thread.id, thread.lastDate);
    }
    setThreads((prev) =>
      prev?.map((t) => (t.id === thread.id ? { ...t, unread: false } : t)) ??
      null
    );
    navigation.navigate("InboxDetail", {
      queryId: thread.id,
      title: thread.subject,
    });
  };

  const search = query.trim().toLowerCase();
  const visible = (threads ?? []).filter(
    (t) =>
      !search ||
      t.subject.toLowerCase().includes(search) ||
      t.lastText.toLowerCase().includes(search) ||
      t.participants.some((p) => p.toLowerCase().includes(search))
  );

  const renderThread = ({ item }: { item: ThreadSummary }) => {
    const name = item.participants.join(", ");
    const avatar = avatarFor(item.participants[0] ?? "AAS");

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openThread(item)}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`${item.unread ? "Unread. " : ""}${name}. ${item.lastText}`}
      >
        <View style={styles.unreadSlot}>
          {item.unread && <View style={styles.unreadDot} />}
        </View>
        <View style={[styles.avatar, { backgroundColor: avatar.color }]}>
          <Text
            style={styles.avatarText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {avatar.initials}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.time}>{formatThreadDate(item.lastDate)}</Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </View>
          <Text style={styles.preview} numberOfLines={2}>
            {item.lastText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goHome}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Ionicons name="chevron-back" size={22} color={colors.link} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("NewMessage")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="New message"
        >
          <Ionicons name="create-outline" size={26} color={colors.link} />
        </TouchableOpacity>
      </View>

      <Text style={styles.largeTitle} accessibilityRole="header">
        Messages
      </Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#6B7280"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {threads === null && !error ? (
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error ??
                (search ? "No matching messages" : "No messages yet")}
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: RFPercentage(2.1),
    color: colors.link,
  },
  largeTitle: {
    fontSize: RFPercentage(4),
    fontWeight: "bold",
    color: colors.primary,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF0F4",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    fontSize: RFPercentage(2),
    color: "#111827",
  },
  spinner: {
    marginTop: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingRight: 12,
  },
  unreadSlot: {
    width: 20,
    height: AVATAR_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.link,
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
  rowBody: {
    flex: 1,
    marginLeft: 10,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  name: {
    flex: 1,
    fontSize: RFPercentage(2.1),
    fontWeight: "bold",
    color: "#111827",
    marginRight: 8,
  },
  time: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginRight: 2,
    marginTop: 2,
  },
  preview: {
    fontSize: RFPercentage(1.8),
    color: "#4B5563",
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginLeft: 20 + AVATAR_SIZE + 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: RFPercentage(2),
    marginTop: 40,
  },
});
