import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  Card,
  ScreenTitle,
  FinancialYearPicker,
  MemberTabs,
  SummaryCard,
  SummaryRow,
  SummarySection,
  memberKey,
} from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { useFinancialYears } from "../../hooks/useFinancialYears";
import { useAuth } from "../context/AuthContext";
import { getContributionCapDetailed } from "../utils/pimsApi";
import {
  ContributionCapDetailed,
  ContributionTransaction,
  RootStackParamList,
} from "../navigation/types";
import { formatCurrency, formatShortDate } from "../utils/format";
import { colors } from "../theme/colors";

// "31/12/1955", matching the web summary
const formatDayMonthYear = (value: string) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

const byNewest = (a: ContributionTransaction, b: ContributionTransaction) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

export default function ContributionCapDetailScreen() {
  const navigation = useNavigation();
  const { memberName } =
    useRoute<RouteProp<RootStackParamList, "ContributionCapDetail">>().params ?? {};
  const { width } = useWindowDimensions();
  // Same side margin as the title and the other screens
  const gutter = width * 0.03;
  const { userData } = useAuth();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();

  const authToken = userData?.authToken;
  const accountId = userData?.accountId;
  const {
    years,
    yearId,
    setYearId,
    selectedYear,
    loading: yearsLoading,
  } = useFinancialYears(authToken, refreshTrigger);

  const [members, setMembers] = useState<ContributionCapDetailed[]>([]);
  // Selected tab, by member name so it stays on the same person when the year changes
  const [selectedKey, setSelectedKey] = useState(memberKey(memberName));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Caps and contributions for the selected year. Stale responses are dropped
  // so switching years quickly can't show the wrong year's numbers.
  useEffect(() => {
    if (!authToken || !accountId || !yearId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const data = await getContributionCapDetailed(authToken, accountId, yearId);
      if (cancelled) return;
      if (!data) {
        setMembers([]);
        setError("Couldn't load contribution caps. Pull down to try again.");
      } else {
        setMembers(data);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken, accountId, yearId, refreshTrigger]);

  const selectedIndex = Math.max(
    members.findIndex((m) => memberKey(m.memberName) === selectedKey),
    0
  );
  const member = members[selectedIndex];
  const transactions = [...(member?.contributionTransactions ?? [])].sort(byNewest);
  const ageAsAt = member?.ageAsAt || selectedYear?.endDate;

  // With several members the selected tab already names the member, so the
  // name header only shows when there's a single member (and no tabs)
  const renderMember = (m: ContributionCapDetailed, showName: boolean) => (
    <SummaryCard title={showName ? m.memberName || "Member" : undefined}>
      <SummaryRow
        label={ageAsAt ? `DOB (age as at ${formatDayMonthYear(ageAsAt)})` : "DOB (age)"}
        value={`${m.birthDate ? formatDayMonthYear(m.birthDate) : "—"}${
          m.age != null ? ` (${m.age})` : ""
        }`}
        first={!showName}
      />

      <SummarySection title="Concessional contributions" />
      <SummaryRow label="Paid to date" value={formatCurrency(m.ccPaidToDate ?? 0)} />
      <SummaryRow label="Maximum" value={formatCurrency(m.ccMaximum ?? 0)} shaded />
      <SummaryRow label="Available" value={formatCurrency(m.ccAvailable ?? 0)} />

      <SummarySection title="Non-concessional contributions" />
      <SummaryRow label="Paid to date" value={formatCurrency(m.nccPaidToDate ?? 0)} />
      <SummaryRow label="Maximum" value={formatCurrency(m.nccMaximum ?? 0)} shaded />
      <SummaryRow label="Available" value={formatCurrency(m.nccAvailable ?? 0)} />
    </SummaryCard>
  );

  const renderTransaction = (item: ContributionTransaction, index: number) => (
    <View key={`${item.id}-${index}`} style={[styles.txRow, index > 0 && styles.txDivider]}>
      <View style={styles.txMain}>
        <Text style={styles.txType} numberOfLines={1}>
          {item.type || item.classification || "Contribution"}
        </Text>
        <Text style={styles.txMeta} numberOfLines={1}>
          {[item.type ? item.classification : null, formatShortDate(item.date)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <Text style={styles.txAmount}>{formatCurrency(item.amount)}</Text>
    </View>
  );

  const renderBody = () => {
    if (!authToken || !accountId) {
      return (
        <Text style={styles.muted}>Your session has expired. Please log in again.</Text>
      );
    }
    if (yearsLoading) {
      return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
    }
    if (years.length === 0) {
      return (
        <Text style={styles.muted}>
          Couldn't load financial years. Pull down to try again.
        </Text>
      );
    }
    if (loading) {
      return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
    }
    if (error) return <Text style={styles.muted}>{error}</Text>;
    if (!member) {
      return (
        <Text style={styles.muted}>
          No contribution cap information is available for this year.
        </Text>
      );
    }

    return (
      <>
        {members.length > 1 && (
          <MemberTabs
            names={members.map((m) => m.memberName)}
            selectedIndex={selectedIndex}
            onSelect={(i) => setSelectedKey(memberKey(members[i].memberName))}
            gutter={gutter}
          />
        )}
        {renderMember(member, members.length === 1)}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Contributions</Text>
          <Text style={styles.listCount}>{transactions.length}</Text>
        </View>
        {transactions.length === 0 ? (
          <Card>
            <Text style={styles.emptyCardText}>
              No contributions recorded for this financial year.
            </Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>{transactions.map(renderTransaction)}</Card>
        )}
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle
            title="Contribution Caps"
            showBack
            onBack={() => navigation.goBack()}
          />

          <View style={{ paddingHorizontal: gutter }}>
            <FinancialYearPicker years={years} selectedId={yearId} onSelect={setYearId} />

            {renderBody()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  spinner: {
    marginTop: 48,
  },
  muted: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: RFPercentage(1.9),
    marginTop: 40,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: RFPercentage(2.3),
    fontWeight: "bold",
    color: colors.primary,
  },
  listCount: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
  },
  listCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 8,
  },
  emptyCardText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: RFPercentage(1.9),
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  txDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  txMain: {
    flex: 1,
    marginRight: 12,
  },
  txType: {
    fontSize: RFPercentage(1.9),
    fontWeight: "600",
    color: "#111827",
  },
  txMeta: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 2,
  },
  txAmount: {
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    color: colors.primary,
  },
});
