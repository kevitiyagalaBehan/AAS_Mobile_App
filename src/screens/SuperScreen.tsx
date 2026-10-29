import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  RefreshControl,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Card, ScreenTitle } from "../../components";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { useAuth } from "../context/AuthContext";
import { fetchSuperData } from "../utils/superData";
import {
  ContributionCap,
  PensionLimitDetails,
  EstimatedMemberDetails,
} from "../navigation/types";
import { formatCurrency, formatShortDate } from "../utils/format";
import { colors } from "../theme/colors";

type CapMember = ContributionCap["members"][number];
type PensionMember = PensionLimitDetails["members"][number];
type FinancialYear = ContributionCap["financialYear"];

type Member = {
  key: string;
  name: string;
  age?: number;
  caps?: CapMember;
  pension?: PensionMember;
  balance?: EstimatedMemberDetails;
};

const ACCUMULATION_COLOR = "#7AC2E1";

// The three super APIs share no member ID, so members are matched by name
const nameKey = (name: string) => name.trim().toLowerCase();

const buildMembers = (
  caps: CapMember[],
  pension: PensionMember[],
  balances: EstimatedMemberDetails[]
): Member[] => {
  const members: Member[] = [];
  const getMember = (name: string) => {
    let member = members.find((m) => m.key === nameKey(name));
    if (!member) {
      member = { key: nameKey(name), name };
      members.push(member);
    }
    return member;
  };

  caps.forEach((c) => Object.assign(getMember(c.name), { caps: c, age: c.age }));
  pension.forEach((p) => {
    const member = getMember(p.name);
    member.pension = p;
    member.age ??= p.age;
  });
  balances.forEach((b) => (getMember(b.memberName).balance = b));
  return members;
};

// "2026/27" from the financial year's start and end dates
const formatFinancialYear = (fy?: FinancialYear) => {
  if (!fy?.startDate || !fy?.endDate) return fy?.financialYear;
  const start = new Date(fy.startDate).getFullYear();
  const end = new Date(fy.endDate).getFullYear();
  return `${start}/${String(end).slice(2)}`;
};

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <View style={barStyles.track}>
    <View
      style={[
        barStyles.fill,
        {
          width: `${max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0}%`,
          backgroundColor: color,
        },
      ]}
    />
  </View>
);

export default function SuperScreen() {
  const { width, height } = useWindowDimensions();
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger();
  const { userData } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [financialYear, setFinancialYear] = useState<FinancialYear>();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const styles = getStyles(width, height);
  const asAtDate = new Date();

  useEffect(() => {
    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { caps, pension, balances } = await fetchSuperData(
        userData.authToken,
        userData.accountId
      );

      const built = buildMembers(
        caps?.members ?? [],
        pension?.members ?? [],
        balances
      );
      setMembers(built);
      setFinancialYear(caps?.financialYear ?? pension?.financialYear);
      setSelectedKey((current) =>
        built.some((m) => m.key === current) ? current : built[0]?.key ?? null
      );
      setLoading(false);
    };

    load();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const member = members.find((m) => m.key === selectedKey);
  const fyLabel = formatFinancialYear(financialYear);

  const renderBalance = (balance: EstimatedMemberDetails) => {
    const total = balance.accumulation + balance.pension;
    const share = (value: number) =>
      total > 0 ? `${((value / total) * 100).toFixed(2)}%` : "0.00%";

    return (
      <Card>
        <Text style={styles.cardCaption}>
          Member balance · {formatShortDate(asAtDate)}
        </Text>
        <Text style={styles.bigAmount}>{formatCurrency(total)}</Text>
        <View style={styles.splitBar}>
          {balance.accumulation > 0 && (
            <View
              style={{ flex: balance.accumulation, backgroundColor: ACCUMULATION_COLOR }}
            />
          )}
          {balance.pension > 0 && (
            <View style={{ flex: balance.pension, backgroundColor: colors.primary }} />
          )}
        </View>
        {[
          { label: "Accumulation", value: balance.accumulation, color: ACCUMULATION_COLOR },
          { label: "Pension", value: balance.pension, color: colors.primary },
        ].map((row) => (
          <View key={row.label} style={styles.splitRow}>
            <View style={[styles.dot, { backgroundColor: row.color }]} />
            <Text style={styles.splitLabel}>{row.label}</Text>
            <Text style={styles.splitPercent}>{share(row.value)}</Text>
            <Text style={styles.splitValue}>{formatCurrency(row.value)}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderPension = (pension: PensionMember) => {
    const met = pension.requiredForMinimum <= 0;
    return (
      <Card>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Minimum pension</Text>
          {financialYear?.endDate && (
            <View style={[styles.badge, met && styles.badgeMet]}>
              <Text style={[styles.badgeText, met && styles.badgeTextMet]}>
                {met ? "Met" : `Due ${formatShortDate(financialYear.endDate)}`}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.mediumAmount}>
          {met
            ? "Minimum paid"
            : `${formatCurrency(pension.requiredForMinimum, 0)} to pay`}
        </Text>
        <ProgressBar
          value={pension.minimumPaidToDate}
          max={pension.minimumPensionAmount}
          color={colors.primary}
        />
        <Text style={styles.helperText}>
          {formatCurrency(pension.minimumPaidToDate, 0)} paid of{" "}
          {formatCurrency(pension.minimumPensionAmount, 0)} required this year
        </Text>
      </Card>
    );
  };

  const renderCap = (
    label: string,
    paid: number,
    maximum: number,
    available: number,
    barColor: string,
    isLast: boolean
  ) => (
    <View style={[styles.capBlock, !isLast && styles.capDivider]}>
      {maximum <= 0 ? (
        <View style={styles.capHeader}>
          <Text style={styles.capLabel}>{label}</Text>
          <Text style={styles.capUnavailable}>Not available · $0 cap</Text>
        </View>
      ) : (
        <>
          <View style={styles.capHeader}>
            <Text style={styles.capLabel}>{label}</Text>
            <Text style={styles.capAvailable}>
              {formatCurrency(available, 0)} available
            </Text>
          </View>
          <ProgressBar value={paid} max={maximum} color={barColor} />
          <Text style={styles.helperText}>
            {formatCurrency(paid, 0)} of {formatCurrency(maximum, 0)} used
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: height * 0.02 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle
            title="Member Details"
            subtitle={fyLabel ? `${fyLabel} financial year` : undefined}
          />

          <View style={styles.bodySection}>
            {loading ? (
              <Text style={styles.muted}>Loading...</Text>
            ) : members.length === 0 ? (
              <Text style={styles.muted}>
                No super or pension information is available for this account.
              </Text>
            ) : (
              <>
                {members.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    {members.map((m) => {
                      const selected = m.key === selectedKey;
                      return (
                        <TouchableOpacity
                          key={m.key}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => setSelectedKey(m.key)}
                          accessibilityRole="tab"
                          accessibilityState={{ selected }}
                          accessibilityLabel={m.name}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected && styles.chipTextSelected,
                            ]}
                          >
                            {m.name.trim().split(/\s+/)[0]}
                            {m.age !== undefined ? ` · ${m.age}` : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {member && (
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberName} numberOfLines={2}>
                      {member.name}
                    </Text>
                    {member.age !== undefined && (
                      <Text style={styles.memberAge}>Age {member.age}</Text>
                    )}
                  </View>
                )}

                {member?.balance && renderBalance(member.balance)}
                {member?.pension &&
                  member.pension.minimumPensionAmount > 0 &&
                  renderPension(member.pension)}
                {member?.caps && (
                  <Card>
                    <Text style={[styles.cardTitle, styles.capsTitle]}>
                      Contribution caps
                    </Text>
                    {renderCap(
                      "Concessional",
                      member.caps.concessionalPaidToDate,
                      member.caps.concessionalMaximum,
                      member.caps.concessionalAvailable,
                      "#5DA8A7",
                      false
                    )}
                    {renderCap(
                      "Non-concessional",
                      member.caps.nonConcessionalPaidToDate,
                      member.caps.nonConcessionalMaximum,
                      member.caps.nonConcessionalAvailable,
                      colors.primary,
                      true
                    )}
                  </Card>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 10,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#eee",
    },
    bodySection: {
      paddingHorizontal: width * 0.03,
    },
    muted: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
      marginTop: height * 0.05,
      paddingHorizontal: width * 0.05,
    },
    chipsRow: {
      gap: 8,
      paddingBottom: 2,
    },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#D1D5DB",
      backgroundColor: "#fff",
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: RFPercentage(1.9),
      fontWeight: "600",
      color: colors.primary,
    },
    chipTextSelected: {
      color: "#fff",
    },
    memberHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 14,
      paddingHorizontal: 4,
    },
    memberName: {
      flex: 1,
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
      color: colors.primary,
      marginRight: 8,
    },
    memberAge: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
    },
    cardCaption: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
    },
    bigAmount: {
      fontSize: RFPercentage(3.8),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 4,
    },
    splitBar: {
      flexDirection: "row",
      height: 10,
      borderRadius: 5,
      overflow: "hidden",
      gap: 2,
      backgroundColor: "#E5E7EB",
      marginVertical: 12,
    },
    splitRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 3,
      marginRight: 10,
    },
    splitLabel: {
      flex: 1,
      fontSize: RFPercentage(1.9),
      color: "#111827",
    },
    splitPercent: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      marginRight: 12,
    },
    splitValue: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: colors.primary,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: "bold",
      color: colors.primary,
    },
    capsTitle: {
      marginBottom: 4,
    },
    badge: {
      backgroundColor: "#FFEDD5",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeMet: {
      backgroundColor: "#DCFCE7",
    },
    badgeText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "bold",
      color: "#C2410C",
    },
    badgeTextMet: {
      color: "#15803D",
    },
    mediumAmount: {
      fontSize: RFPercentage(3),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 6,
    },
    helperText: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 6,
    },
    capBlock: {
      paddingVertical: 10,
    },
    capDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    capHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    capLabel: {
      fontSize: RFPercentage(1.9),
      color: "#111827",
    },
    capAvailable: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: colors.primary,
    },
    capUnavailable: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
    },
  });
