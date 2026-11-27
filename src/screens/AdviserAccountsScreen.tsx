import React, { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { getAdviserAccounts, markAccountViewed } from "../utils/adviserApi";
import { formatCompactCurrency } from "../utils/format";
import {
  AccountFlagSeverity,
  AdviserAccount,
  AdviserAccountsSummary,
} from "../navigation/types";
import { useClientView } from "../../hooks/useClientView";
import { colors } from "../theme/colors";

const RECENT_LIMIT = 10;

const FLAG_COLORS: Record<AccountFlagSeverity, { bg: string; fg: string }> = {
  info: { bg: "#E6EEFB", fg: "#2F5DB3" },
  warning: { bg: "#FDF0DC", fg: "#A15C07" },
  danger: { bg: "#FDE7E7", fg: "#B42318" },
};

// "Chen Family Super Fund" -> "CF", "Ellis, Margaret" -> "EM"
const accountInitials = (name: string) =>
  name
    .replace(/[^A-Za-zs]/g, "")
    .split(/s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const formatBalance = (balance: number | null) =>
  balance == null ? "-" : formatCompactCurrency(balance);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Filter keys are lower case ("smsf"); account types are "SMSF", "Trust" etc.
const typeKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

// lastViewedAt is Australian local time with no offset, which Date.parse reads as device time
const viewedTime = (a: AdviserAccount) => (a.lastViewedAt ? Date.parse(a.lastViewedAt) || 0 : 0);

export default function AdviserAccountsScreen() {
  const { userData } = useAuth();
  const authToken = userData?.authToken;
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);
  const { openClient } = useClientView();

  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<AdviserAccountsSummary | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!authToken) return;
    const result = await getAdviserAccounts(authToken);
    if (result) setData(result);
    setError(!result);
  }, [authToken]);

  const { refreshing, onRefresh } = useRefreshTrigger(load);

  // Also runs on the way back from a client, so Recently viewed picks up that visit
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const search = searchText.trim().toLowerCase();

  // The server sends every account, so search and filter run here
  const items = useMemo(
    () =>
      (data?.items ?? [])
        .filter(
          (a) =>
            (filter === "all" || typeKey(a.accountType) === typeKey(filter)) &&
            (!search ||
              [a.accountName, a.clientNames, a.accountCode].some((v) =>
                v?.toLowerCase().includes(search)
              ))
        )
        .sort((a, b) => a.accountName.localeCompare(b.accountName)),
    [data, filter, search]
  );

  const recent = useMemo(
    () =>
      (data?.items ?? [])
        .filter((a) => a.lastViewedAt)
        .sort((a, b) => viewedTime(b) - viewedTime(a))
        .slice(0, RECENT_LIMIT),
    [data]
  );

  // Hide empty account types, but keep the selected one so it can be switched off
  const filters = (data?.filters ?? []).filter(
    (f) => f.key === "all" || f.key === filter || f.count !== 0
  );

  const openAccount = (account: AdviserAccount) => {
    if (!authToken) return;
    markAccountViewed(authToken, account.accountId);
    // Moves it to the front of Recently viewed now; the reload on return confirms it
    const viewedAt = new Date().toISOString();
    setData((prev) =>
      prev && {
        ...prev,
        items: prev.items.map((a) => (a.accountId === account.accountId ? { ...a, lastViewedAt: viewedAt } : a)),
      }
    );
    openClient({
      accountId: account.accountId,
      accountName: account.accountName,
      accountType: account.accountType,
      clientNames: account.clientNames,
    });
  };

  const showRecent = !search && filter === "all" && recent.length > 0;

  const renderAccount = ({ item }: { item: AdviserAccount }) => (
    <TouchableOpacity
      style={styles.accountRow}
      onPress={() => openAccount(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.accountName}, ${item.accountType}, ${formatBalance(item.balance)}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{accountInitials(item.accountName)}</Text>
      </View>
      <View style={styles.accountMain}>
        <Text style={styles.accountName} numberOfLines={1}>
          {item.accountName}
        </Text>
        <Text style={styles.accountSub} numberOfLines={1}>
          {[
            item.accountType,
            item.accountCode,
            item.clientNames !== item.accountName ? item.clientNames : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {!!item.flags?.length && (
          <View style={styles.flags}>
            {item.flags.map((flag) => {
              const c = FLAG_COLORS[flag.severity] ?? FLAG_COLORS.info;
              return (
                <View key={flag.type} style={[styles.flag, { backgroundColor: c.bg }]}>
                  <Text style={[styles.flagText, { color: c.fg }]}>{flag.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      <Text style={styles.balance}>{formatBalance(item.balance)}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const listHeader = showRecent ? (
    <View>
      <Text style={styles.sectionTitle}>Recently viewed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentList}
        keyboardShouldPersistTaps="handled"
      >
        {recent.map((r) => (
          <TouchableOpacity
            key={r.accountId}
            style={styles.recentCard}
            onPress={() => openAccount(r)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${r.accountName}, ${formatBalance(r.balance)}`}
          >
            <View style={[styles.avatar, styles.recentAvatar]}>
              <Text style={styles.avatarText}>{accountInitials(r.accountName)}</Text>
            </View>
            <Text style={styles.recentName} numberOfLines={2}>
              {r.accountName}
            </Text>
            <Text style={styles.recentBalance}>{formatBalance(r.balance)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.sectionTitle}>All accounts</Text>
    </View>
  ) : null;

  const emptyState = !data && !error ? (
    <ActivityIndicator style={styles.placeholder} color={colors.primary} />
  ) : (
    <Text style={[styles.placeholder, styles.placeholderText]}>
      {error
        ? "Couldn't load accounts."
        : search
          ? `No accounts match "${searchText.trim()}".`
          : "No accounts."}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.top}>
        <Text style={styles.title}>Accounts</Text>
        {data && (
          <Text style={styles.summary}>
            {plural(data.totalAccounts, "account")} ·{" "}
            {formatCompactCurrency(data.fundsUnderManagement)} under management
          </Text>
        )}

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by name or account code"
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search accounts"
          />
          {searchText !== "" && (
            <TouchableOpacity
              onPress={() => setSearchText("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {filters.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
          >
            {filters.map((f) => {
              const selected = f.key === filter;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {f.label}
                    {f.count != null ? ` ${f.count}` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.accountId}
        renderItem={renderAccount}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#eee",
    },
    top: {
      paddingHorizontal: width * 0.03,
      paddingBottom: height * 0.01,
    },
    title: {
      fontSize: RFPercentage(3.6),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: height * 0.02,
    },
    summary: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      marginTop: 2,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#D9DEE7",
      paddingHorizontal: 12,
      marginTop: height * 0.015,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: RFPercentage(2),
      color: colors.primary,
    },
    chips: {
      gap: 8,
      paddingTop: height * 0.012,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#D9DEE7",
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: colors.primary,
    },
    chipTextSelected: {
      color: "#fff",
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: width * 0.03,
      paddingBottom: height * 0.02,
    },
    sectionTitle: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: height * 0.01,
      marginBottom: 8,
    },
    recentList: {
      gap: 10,
      paddingBottom: height * 0.01,
    },
    recentCard: {
      width: width * 0.36,
      backgroundColor: "#fff",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      padding: 12,
    },
    recentAvatar: {
      marginBottom: 8,
    },
    recentName: {
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: colors.primary,
      minHeight: RFPercentage(1.8) * 2.6,
    },
    recentBalance: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 4,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#fff",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      padding: 12,
    },
    separator: {
      height: 8,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#E6EAF2",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: colors.primary,
    },
    accountMain: {
      flex: 1,
    },
    accountName: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: colors.primary,
    },
    accountSub: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 2,
    },
    flags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    flag: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    flagText: {
      fontSize: RFPercentage(1.5),
      fontWeight: "bold",
    },
    balance: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: colors.primary,
    },
    placeholder: {
      marginTop: height * 0.08,
    },
    placeholderText: {
      textAlign: "center",
      fontSize: RFPercentage(1.9),
      color: "#6B7280",
    },
  });
