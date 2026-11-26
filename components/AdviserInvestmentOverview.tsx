import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";
import { useAuth } from "../src/context/AuthContext";
import { getAdviserInvestmentOverview } from "../src/utils/adviserApi";
import { AdviserInvestmentOverview as OverviewData } from "../src/navigation/types";
import {
  formatCompactCurrency,
  formatCurrency,
  formatShortDate,
} from "../src/utils/format";
import { colors } from "../src/theme/colors";

// Entity type colours, in order of FUM. Mid-tones so they read on navy and on white.
const ENTITY_COLORS = ["#5B8DEF", "#4FB3A0", "#E0A63B", "#D9707A", "#9B7FD9", "#7A8699"];

const GOOD = { bg: "#E3F4E8", fg: "#1E7B3C" };
const WARN = { bg: "#FDF0DC", fg: "#A15C07" };

const formatShare = (share: number) => {
  const pct = share * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
};

// "Company", "Company or Trust", "Company, Individual or Trust"
const joinWithOr = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

type Props = { refreshTrigger: number };

export default function AdviserInvestmentOverview({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userData?.authToken) return;
    let cancelled = false;

    setError(false);
    getAdviserInvestmentOverview(userData.authToken).then((result) => {
      if (cancelled) return;
      if (result) setData(result);
      else setError(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, refreshTrigger]);

  if (!data) {
    return (
      <View style={styles.placeholder}>
        {error ? (
          <Text style={styles.errorText}>Couldn't load the investment overview.</Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  const activeTypes = data.entityTypes
    .filter((e) => e.clientCount > 0)
    .sort((a, b) => b.totalBalance - a.totalBalance)
    .map((e, i) => ({ ...e, color: ENTITY_COLORS[i % ENTITY_COLORS.length] }));
  const emptyTypes = data.entityTypes
    .filter((e) => e.clientCount === 0)
    .map((e) => e.entityType);
  const fumTotal = activeTypes.reduce((sum, e) => sum + e.totalBalance, 0);

  const clearChecks = data.portfolioChecks.filter((c) => c.clientCount === 0).length;
  const allClear = clearChecks === data.portfolioChecks.length;

  return (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Funds under management</Text>
        <Text style={styles.summaryValue} adjustsFontSizeToFit numberOfLines={1}>
          {formatCurrency(data.fundsUnderManagement)}
        </Text>

        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Portfolio clients</Text>
            <Text style={styles.tileValue}>{data.portfolioClients}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Average balance</Text>
            <Text style={styles.tileValue} adjustsFontSizeToFit numberOfLines={1}>
              {formatCurrency(data.averageBalance, 0)}
            </Text>
          </View>
        </View>

        {fumTotal > 0 && (
          <>
            <View style={styles.bar}>
              {activeTypes.map((e) => (
                <View
                  key={e.entityType}
                  style={[styles.barSegment, { flex: e.totalBalance, backgroundColor: e.color }]}
                />
              ))}
            </View>
            <View style={styles.legend}>
              {activeTypes.map((e) => (
                <View key={e.entityType} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: e.color }]} />
                  <Text style={styles.legendText}>
                    {e.entityType} {formatShare(e.totalBalance / fumTotal)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <Card>
        <Text style={styles.cardTitle}>Business overview</Text>
        <Text style={styles.cardSubtitle}>Portfolio clients by entity type</Text>
        {activeTypes.map((e, i) => (
          <View key={e.entityType} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
            <View style={[styles.rowSwatch, { backgroundColor: e.color }]} />
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{e.entityType}</Text>
              <Text style={styles.rowSub}>{plural(e.clientCount, "client")}</Text>
            </View>
            <View style={styles.rowEnd}>
              <Text style={styles.rowTitle}>{formatCompactCurrency(e.totalBalance)}</Text>
              <Text style={styles.rowSub}>Avg {formatCompactCurrency(e.averageBalance)}</Text>
            </View>
          </View>
        ))}
        {emptyTypes.length > 0 && (
          <Text style={[styles.footnote, activeTypes.length > 0 && styles.listRowBorder]}>
            No {joinWithOr(emptyTypes)} clients
          </Text>
        )}
      </Card>

      <Card>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, styles.titleFlex]}>Portfolio checks</Text>
          <View style={[styles.pill, { backgroundColor: allClear ? GOOD.bg : WARN.bg }]}>
            <Text style={[styles.pillText, { color: allClear ? GOOD.fg : WARN.fg }]}>
              {clearChecks} of {data.portfolioChecks.length} clear
            </Text>
          </View>
        </View>
        {data.portfolioChecks.map((check, i) => {
          const clear = check.clientCount === 0;
          const tone = clear ? GOOD : WARN;
          return (
            <View key={check.checkKey} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
              <View style={[styles.checkIcon, { backgroundColor: tone.bg }]}>
                <Ionicons
                  name={clear ? "checkmark" : "alert"}
                  size={16}
                  color={tone.fg}
                />
              </View>
              <Text style={styles.checkLabel}>{check.label}</Text>
              <View style={[styles.countPill, { backgroundColor: tone.bg }]}>
                <Text style={[styles.pillText, { color: tone.fg }]}>{check.clientCount}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {data.topTenInvestments.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Top 10 investments</Text>
          <Text style={styles.cardSubtitle}>As at {formatShortDate(data.asAtDate)}</Text>
          {data.topTenInvestments.map((inv, i) => (
            <View key={inv.investmentCode} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
              <Text style={styles.rank}>{i + 1}</Text>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {inv.investmentCode}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {inv.investmentName ? `${inv.investmentName} · ` : ""}
                  {plural(inv.clientCount, "client")}
                </Text>
              </View>
              <View style={styles.rowEnd}>
                <Text style={styles.rowTitle}>{formatCompactCurrency(inv.marketValue)}</Text>
                <Text style={styles.rowSub}>Avg {formatCompactCurrency(inv.averageValue)}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    placeholder: {
      minHeight: height * 0.3,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      color: "#B91C1C",
      fontSize: RFPercentage(1.9),
    },
    summaryCard: {
      backgroundColor: colors.primary,
      borderRadius: 18,
      paddingHorizontal: width * 0.045,
      paddingVertical: height * 0.02,
    },
    summaryLabel: {
      fontSize: RFPercentage(1.8),
      color: "#C9D3E6",
    },
    summaryValue: {
      fontSize: RFPercentage(4.2),
      fontWeight: "bold",
      color: "#fff",
    },
    tiles: {
      flexDirection: "row",
      gap: 8,
      marginTop: height * 0.015,
    },
    tile: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tileLabel: {
      fontSize: RFPercentage(1.6),
      color: "#C9D3E6",
    },
    tileValue: {
      fontSize: RFPercentage(2.6),
      fontWeight: "bold",
      color: "#fff",
      marginTop: 2,
    },
    bar: {
      flexDirection: "row",
      gap: 4,
      height: 8,
      marginTop: height * 0.018,
    },
    barSegment: {
      borderRadius: 4,
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 14,
      rowGap: 6,
      marginTop: 10,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendSwatch: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    legendText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "600",
      color: "#fff",
    },
    cardTitle: {
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
      color: colors.primary,
    },
    cardSubtitle: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 2,
      marginBottom: 4,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    titleFlex: {
      flex: 1,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      gap: 12,
    },
    listRowBorder: {
      borderTopWidth: 1,
      borderTopColor: "#EEF0F3",
    },
    rowSwatch: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    rowMain: {
      flex: 1,
    },
    rowEnd: {
      alignItems: "flex-end",
    },
    rowTitle: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: colors.primary,
    },
    rowSub: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 1,
    },
    rank: {
      width: 18,
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: "#9CA3AF",
      textAlign: "center",
    },
    footnote: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      paddingTop: 10,
    },
    pill: {
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pillText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "bold",
    },
    checkIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    checkLabel: {
      flex: 1,
      fontSize: RFPercentage(1.9),
      color: "#1F2937",
    },
    countPill: {
      minWidth: 36,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: "center",
    },
  });
