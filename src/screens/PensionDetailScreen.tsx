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
import { getPensionLimitMembers } from "../utils/pimsApi";
import {
  PensionLimitFigures,
  PensionLimitMember,
  RootStackParamList,
} from "../navigation/types";
import { formatCurrency } from "../utils/format";
import { colors } from "../theme/colors";

// Rows shown for each set of figures, in this order
const FIGURE_ROWS: { label: string; key: keyof Omit<PensionLimitFigures, "description"> }[] = [
  { label: "Minimum", key: "minimum" },
  { label: "Maximum", key: "max" },
  { label: "Plan", key: "plan" },
  { label: "Drawdowns to date", key: "drawdownsToDate" },
  { label: "Required for minimum", key: "requiredForMinimum" },
  { label: "Required for plan", key: "requiredForPlan" },
  { label: "Remaining until max", key: "remainingUntilMax" },
  { label: "Tax free", key: "taxFree" },
];

export default function PensionDetailScreen() {
  const navigation = useNavigation();
  const { memberName } =
    useRoute<RouteProp<RootStackParamList, "PensionDetail">>().params ?? {};
  const { width } = useWindowDimensions();
  // Same side margin as the title and the other screens
  const gutter = width * 0.03;
  const { userData } = useAuth();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();

  const authToken = userData?.authToken;
  const accountId = userData?.accountId;
  const { years, yearId, setYearId, loading: yearsLoading } = useFinancialYears(
    authToken,
    refreshTrigger
  );

  const [members, setMembers] = useState<PensionLimitMember[]>([]);
  // Selected tab, by member name so it stays on the same person when the year changes
  const [selectedKey, setSelectedKey] = useState(memberKey(memberName));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stale responses are dropped so switching years quickly can't show the wrong year
  useEffect(() => {
    if (!authToken || !accountId || !yearId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const data = await getPensionLimitMembers(authToken, accountId, yearId);
      if (cancelled) return;
      if (!data) {
        setMembers([]);
        setError("Couldn't load pension details. Pull down to try again.");
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
  const accounts = member?.pensionAccountSummary ?? [];

  const renderFigures = (figures: PensionLimitFigures | undefined) =>
    FIGURE_ROWS.map((row, i) => (
      <SummaryRow
        key={row.key}
        label={row.label}
        value={formatCurrency(figures?.[row.key] ?? 0)}
        shaded={i % 2 === 1}
      />
    ));

  // With several members the selected tab already names the member, so the
  // name header only shows when there's a single member (and no tabs)
  const renderMember = (m: PensionLimitMember, showName: boolean) => (
    <SummaryCard title={showName ? m.memberName || "Member" : undefined}>
      <SummarySection title="Gross drawdowns" first={!showName} />
      {renderFigures(m.grossDrawdowns)}

      <SummarySection title="PAYG tax" />
      {renderFigures(m.paygTax)}

      <SummarySection title="Net drawdowns" />
      {renderFigures(m.netDrawdowns)}
    </SummaryCard>
  );

  const renderBody = () => {
    if (!authToken || !accountId) {
      return <Text style={styles.muted}>Your session has expired. Please log in again.</Text>;
    }
    if (yearsLoading) {
      return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
    }
    if (years.length === 0) {
      return (
        <Text style={styles.muted}>Couldn't load financial years. Pull down to try again.</Text>
      );
    }
    if (loading) {
      return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
    }
    if (error) return <Text style={styles.muted}>{error}</Text>;
    if (!member) {
      return (
        <Text style={styles.muted}>No pension information is available for this year.</Text>
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

        {accounts.length > 0 && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Pension accounts</Text>
              <Text style={styles.listCount}>{accounts.length}</Text>
            </View>
            {accounts.map((account, i) => (
              <SummaryCard key={`account-${i}`} title={account.description || "Pension account"}>
                {renderFigures(account)}
              </SummaryCard>
            ))}
          </>
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
          <ScreenTitle title="Pension" showBack onBack={() => navigation.goBack()} />

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
});
