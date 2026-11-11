import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getCashTransactions } from "../src/utils/pimsApi";
import { CashTransactions } from "../src/navigation/types";
import { formatCurrency, formatShortDate, toApiDate } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";
import DetailModal from "./DetailModal";
import DateRangePicker from "./DateRangePicker";

export const cleanDescription = (description?: string) =>
  description?.includes("Closing Balance")
    ? description.replace("Closing Balance", "").trim()
    : description ?? "";

// The API's balance already includes the row's amount; show it as before that row,
// which is how the previous table showed it.
const displayBalance = (item: CashTransactions) => {
  if (item.credit != null) return item.balance - item.credit;
  if (item.debit != null) return item.balance + item.debit;
  return item.balance;
};

export default function Transactions({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const [transactions, setTransactions] = useState<CashTransactions[] | null>(
    null
  );
  const [startDate, setStartDate] = useState(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return oneYearAgo;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<CashTransactions | null>(
    null
  );

  const startKey = toApiDate(startDate);
  const endKey = toApiDate(endDate);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getCashTransactions(
          userData.authToken,
          userData.accountId,
          startKey,
          endKey
        );
        if (!cancelled) setTransactions(data ?? []);
      } catch {
        if (!cancelled) setError("Failed to load transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, userData?.accountId, refreshTrigger, startKey, endKey]);

  const holdings = Array.from(
    new Set((transactions ?? []).map((t) => t.holdingDescription))
  );
  // Falls back to all accounts if the chosen one has no rows in the new date range
  const activeHolding = holdings.includes(selectedHolding) ? selectedHolding : "";
  const visible = (transactions ?? []).filter(
    (t) => !activeHolding || t.holdingDescription === activeHolding
  );
  const moneyIn = visible.reduce((sum, t) => sum + (t.credit ?? 0), 0);
  const moneyOut = visible.reduce((sum, t) => sum + (t.debit ?? 0), 0);
  const showAccountName = holdings.length > 1 && !activeHolding;

  const detailRows = selectedItem
    ? [
        { label: "Date", value: formatShortDate(selectedItem.transactionDate) },
        { label: "Description", value: cleanDescription(selectedItem.transactionDescription) },
        { label: "Classification", value: selectedItem.classification },
        {
          label: "Deposit",
          value: selectedItem.credit != null ? formatCurrency(selectedItem.credit) : null,
        },
        {
          label: "Withdrawal",
          value: selectedItem.debit != null ? formatCurrency(selectedItem.debit) : null,
        },
        { label: "Balance", value: formatCurrency(displayBalance(selectedItem)) },
      ]
    : [];

  const renderRow = (item: CashTransactions, index: number) => {
    const isCredit = item.credit != null;
    const isDebit = !isCredit && item.debit != null;
    const date = formatShortDate(item.transactionDate);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.row, index > 0 && styles.rowDivider]}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.6}
      >
        <View
          style={[
            styles.iconBox,
            isCredit ? styles.iconIn : isDebit ? styles.iconOut : styles.iconNeutral,
          ]}
        >
          <Ionicons
            name={isCredit ? "arrow-down" : isDebit ? "arrow-up" : "wallet-outline"}
            size={18}
            color={isCredit ? "#15803D" : isDebit ? colors.primary : "#6B7280"}
          />
        </View>

        <View style={styles.rowMain}>
          <Text style={styles.description} numberOfLines={2}>
            {cleanDescription(item.transactionDescription)}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {showAccountName ? `${date} · ${item.holdingDescription}` : date}
          </Text>
        </View>

        <View style={styles.rowAmounts}>
          {isCredit && (
            <Text style={[styles.amount, styles.amountIn]}>
              +{formatCurrency(item.credit!)}
            </Text>
          )}
          {isDebit && (
            <Text style={styles.amount}>−{formatCurrency(item.debit!)}</Text>
          )}
          <Text style={styles.balance}>
            Bal {formatCurrency(displayBalance(item))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <DateRangePicker
        from={startDate}
        to={endDate}
        onChangeFrom={setStartDate}
        onChangeTo={setEndDate}
      />

      {holdings.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {["", ...holdings].map((holding) => {
            const selected = holding === activeHolding;
            return (
              <TouchableOpacity
                key={holding || "all"}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSelectedHolding(holding)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {holding || "All accounts"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator
          style={styles.spinner}
          size="large"
          color={colors.primary}
        />
      ) : error ? (
        <Text style={styles.emptyText}>{error}</Text>
      ) : (
        <>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Money in</Text>
              <Text style={[styles.summaryValue, styles.amountIn]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(moneyIn)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Money out</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(moneyOut)}
              </Text>
            </View>
          </Card>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Transactions</Text>
            <Text style={styles.listCount}>{visible.length}</Text>
          </View>

          {visible.length === 0 ? (
            <Card>
              <Text style={styles.emptyCardText}>
                No transactions between {formatShortDate(startDate)} and{" "}
                {formatShortDate(endDate)}.
              </Text>
            </Card>
          ) : (
            <Card style={styles.listCard}>{visible.map(renderRow)}</Card>
          )}
        </>
      )}

      <DetailModal
        visible={!!selectedItem}
        title={selectedItem?.holdingDescription ?? ""}
        rows={detailRows}
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    chipRow: {
      gap: 8,
      paddingTop: 12,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: RFPercentage(1.8),
      color: colors.primary,
      fontWeight: "600",
    },
    chipTextSelected: {
      color: "#fff",
    },
    spinner: {
      marginTop: height * 0.08,
    },
    emptyText: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
      marginTop: height * 0.05,
    },
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryItem: {
      flex: 1,
    },
    summaryDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: "#E5E7EB",
      marginHorizontal: 16,
    },
    summaryLabel: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
    },
    summaryValue: {
      fontSize: RFPercentage(2.6),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 4,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
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
    iconNeutral: {
      backgroundColor: "#F3F4F6",
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
    rowSub: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 2,
    },
    rowAmounts: {
      alignItems: "flex-end",
      maxWidth: width * 0.42,
    },
    amount: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: colors.primary,
    },
    amountIn: {
      color: "#15803D",
    },
    balance: {
      fontSize: RFPercentage(1.6),
      color: "#9CA3AF",
      marginTop: 2,
    },
  });
