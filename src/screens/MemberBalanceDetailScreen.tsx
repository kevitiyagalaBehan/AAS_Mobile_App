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
  ScreenTitle,
  DateRangePicker,
  MemberTabs,
  SummaryCard,
  SummaryRow,
  SummarySection,
  memberKey,
} from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { useAuth } from "../context/AuthContext";
import { getEstimatedMemberStatement } from "../utils/pimsApi";
import { EstimatedMemberDetails, RootStackParamList } from "../navigation/types";
import { formatCurrency, formatShortDate, toApiDate } from "../utils/format";
import { colors } from "../theme/colors";

// "$12,345.67 · 45.12%" - each part's share of its group's total
const withShare = (value: number, total: number) =>
  `${formatCurrency(value ?? 0)} · ${total > 0 ? ((value / total) * 100).toFixed(2) : "0.00"}%`;

export default function MemberBalanceDetailScreen() {
  const navigation = useNavigation();
  const { memberName } =
    useRoute<RouteProp<RootStackParamList, "MemberBalanceDetail">>().params ?? {};
  const { width } = useWindowDimensions();
  // Same side margin as the title and the other screens
  const gutter = width * 0.03;
  const { userData } = useAuth();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();

  // Defaults to the last 12 months, the same period as the Members screen's card
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
  });
  const [toDate, setToDate] = useState(new Date());

  const [members, setMembers] = useState<EstimatedMemberDetails[]>([]);
  // Selected tab, by member name so it stays on the same person when the dates change
  const [selectedKey, setSelectedKey] = useState(memberKey(memberName));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authToken = userData?.authToken;
  const accountId = userData?.accountId;
  // Effects depend on the calendar day, not the Date object identity
  const fromKey = toApiDate(fromDate);
  const toKey = toApiDate(toDate);

  // Stale responses are dropped so changing dates quickly can't show an old range
  useEffect(() => {
    if (!authToken || !accountId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const data = await getEstimatedMemberStatement(authToken, accountId, fromDate, toDate);
      if (cancelled) return;
      if (!data) {
        setMembers([]);
        setError("Couldn't load member balances. Pull down to try again.");
      } else {
        setMembers(data);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken, accountId, fromKey, toKey, refreshTrigger]);

  const selectedIndex = Math.max(
    members.findIndex((m) => memberKey(m.memberName) === selectedKey),
    0
  );
  const member = members[selectedIndex];

  // With several members the selected tab already names the member, so the
  // name header only shows when there's a single member (and no tabs)
  const renderMember = (m: EstimatedMemberDetails, showName: boolean) => {
    const accumulation = m.accumulation ?? 0;
    const pension = m.pension ?? 0;
    const total = accumulation + pension;
    const taxTotal = (m.taxFree ?? 0) + (m.taxableTaxed ?? 0) + (m.taxableUntaxed ?? 0);

    return (
      <SummaryCard title={showName ? m.memberName || "Member" : undefined}>
        <SummarySection title={`Balance as at ${formatShortDate(toDate)}`} first={!showName} />
        <SummaryRow label="Accumulation" value={withShare(accumulation, total)} />
        <SummaryRow label="Pension" value={withShare(pension, total)} shaded />
        <SummaryRow label="Total" value={formatCurrency(total)} bold />

        <SummarySection title="Tax components" />
        <SummaryRow label="Tax free" value={withShare(m.taxFree, taxTotal)} />
        <SummaryRow label="Taxable taxed" value={withShare(m.taxableTaxed, taxTotal)} shaded />
        <SummaryRow label="Taxable untaxed" value={withShare(m.taxableUntaxed, taxTotal)} />
      </SummaryCard>
    );
  };

  const renderBody = () => {
    if (!authToken || !accountId) {
      return <Text style={styles.muted}>Your session has expired. Please log in again.</Text>;
    }
    if (loading) {
      return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
    }
    if (error) return <Text style={styles.muted}>{error}</Text>;
    if (!member) {
      return (
        <Text style={styles.muted}>
          No member balance information is available for these dates.
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
            title="Member Balance"
            showBack
            onBack={() => navigation.goBack()}
          />

          <View style={{ paddingHorizontal: gutter }}>
            <DateRangePicker
              from={fromDate}
              to={toDate}
              onChangeFrom={setFromDate}
              onChangeTo={setToDate}
            />

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
});
