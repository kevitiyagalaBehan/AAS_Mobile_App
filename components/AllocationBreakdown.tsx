import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import {
  getAssetAllocationSummaryOther,
  getAssetAllocationSummaryFamily,
} from "../src/utils/pimsApi";
import { toFamilyPortfolioData } from "../hooks/usePortfolioSummaryFamily";
import { PortfolioData } from "../src/navigation/types";
import { getColorForAssetClass } from "../src/utils/assetColors";
import { formatCurrency } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";

type AllocationBreakdownProps = {
  refreshTrigger: number;
  onSeeHoldings?: () => void;
};

export default function AllocationBreakdown({
  refreshTrigger,
  onSeeHoldings,
}: AllocationBreakdownProps) {
  const { userData } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      if (userData.accountType === "Family Group") {
        const rows = await getAssetAllocationSummaryFamily(
          userData.authToken,
          userData.accountId
        );
        setData(rows ? toFamilyPortfolioData(rows) : null);
      } else {
        setData(
          await getAssetAllocationSummaryOther(
            userData.authToken,
            userData.accountId
          )
        );
      }
      setLoading(false);
    };

    load();
  }, [
    userData?.authToken,
    userData?.accountId,
    userData?.accountType,
    refreshTrigger,
  ]);

  const categories = data?.assetCategories ?? [];
  const assetClasses = categories.flatMap((category) => category.assetClasses ?? []);

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Asset allocation</Text>
        {onSeeHoldings && (
          <TouchableOpacity onPress={onSeeHoldings} hitSlop={8}>
            <Text style={styles.link}>See holdings</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : assetClasses.length === 0 ? (
        <Text style={styles.muted}>No asset allocation data available</Text>
      ) : (
        <>
          <View style={styles.stackedBar}>
            {assetClasses
              .filter((asset) => asset.percentage > 0)
              .map((asset) => (
                <View
                  key={asset.assetClass}
                  style={[
                    styles.barSegment,
                    {
                      flex: asset.percentage,
                      backgroundColor: getColorForAssetClass(asset.assetClass),
                    },
                  ]}
                />
              ))}
          </View>

          {categories.length > 1 && (
            <View style={styles.tilesRow}>
              {categories.map((category) => (
                <View key={category.assetCategory} style={styles.tile}>
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {category.assetCategory}
                  </Text>
                  <Text style={styles.tileValue}>
                    {category.percentage.toFixed(2)}%
                  </Text>
                  <Text style={styles.tileAmount} numberOfLines={1}>
                    {formatCurrency(category.marketValue, 0)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {assetClasses.map((asset) => (
            <View key={asset.assetClass} style={styles.classRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: getColorForAssetClass(asset.assetClass) },
                ]}
              />
              <Text style={styles.className} numberOfLines={1}>
                {asset.assetClass}
              </Text>
              <Text style={styles.classValue}>
                {formatCurrency(asset.marketValue, 0)}
              </Text>
              <Text style={styles.classPercent}>
                {asset.percentage.toFixed(2)}%
              </Text>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  },
  stackedBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    gap: 2,
    marginBottom: 12,
  },
  barSegment: {
    height: "100%",
  },
  tilesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tileLabel: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
  },
  tileValue: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
    marginTop: 2,
  },
  tileAmount: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 1,
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 10,
  },
  className: {
    flex: 1,
    fontSize: RFPercentage(1.9),
    color: "#111827",
  },
  classValue: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
    marginRight: 12,
  },
  classPercent: {
    width: 64,
    textAlign: "right",
    fontSize: RFPercentage(1.9),
    fontWeight: "bold",
    color: colors.primary,
  },
});
