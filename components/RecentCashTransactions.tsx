import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getCashTransactions } from "../src/utils/pimsApi";
import { CashTransactions } from "../src/navigation/types";
import { formatCurrency, formatShortDate, toApiDate } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import { cleanDescription } from "./CashTransactions";
import Card from "./Card";

const MAX_ROWS = 5;
// The API only takes a date range, so widen it until there are enough rows.
// Most accounts fill the card from the first window; quiet ones go further back.
const LOOKBACK_MONTHS = [3, 12, 60, 240];

type RecentCashTransactionsProps = {
  refreshTrigger: number;
  onSeeAll?: () => void;
};

export default function RecentCashTransactions({
  refreshTrigger,
  onSeeAll,
}: RecentCashTransactionsProps) {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<CashTransactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      const end = new Date();

      setLoading(true);
      setError(false);
      try {
        let rows: CashTransactions[] = [];
        for (const months of LOOKBACK_MONTHS) {
          const start = new Date();
          start.setMonth(start.getMonth() - months);
          const data = await getCashTransactions(
            userData.authToken,
            userData.accountId,
            toApiDate(start),
            toApiDate(end)
          );
          if (cancelled) return;
          // Skip opening/closing balance rows, which have no amount
          rows = (data ?? []).filter((t) => t.credit != null || t.debit != null);
          if (rows.length >= MAX_ROWS) break;
        }
        const recent = rows
          .sort(
            (a, b) =>
              new Date(b.transactionDate).getTime() -
              new Date(a.transactionDate).getTime()
          )
          .slice(0, MAX_ROWS);
        setTransactions(recent);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Cash Transactions</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : error ? (
        <Text style={styles.muted}>Failed to load transactions</Text>
      ) : transactions.length === 0 ? (
        <Text style={styles.muted}>No recent transactions</Text>
      ) : (
        transactions.map((item, index) => {
          const isCredit = item.credit != null;
          return (
            <View
              key={item.id}
              style={[styles.row, index > 0 && styles.rowDivider]}
            >
              <View
                style={[styles.iconBox, isCredit ? styles.iconIn : styles.iconOut]}
              >
                <Ionicons
                  name={isCredit ? "add" : "remove"}
                  size={18}
                  color={isCredit ? "#15803D" : colors.primary}
                />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.description} numberOfLines={1}>
                  {cleanDescription(item.transactionDescription)}
                </Text>
                <Text style={styles.date}>
                  {formatShortDate(item.transactionDate)}
                </Text>
              </View>
              <Text style={[styles.amount, isCredit && styles.amountIn]}>
                {isCredit
                  ? `+${formatCurrency(item.credit!)}`
                  : `−${formatCurrency(item.debit!)}`}
              </Text>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: RFPercentage(2.4),
    fontWeight: "bold",
    color: colors.primary,
  },
  link: {
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    color: colors.link,
  },
  muted: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconIn: {
    backgroundColor: "#DCFCE7",
  },
  iconOut: {
    backgroundColor: colors.primarySoft,
  },
  rowMain: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: RFPercentage(2),
    fontWeight: "600",
    color: "#111827",
  },
  date: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 2,
  },
  amount: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  amountIn: {
    color: "#15803D",
  },
});
