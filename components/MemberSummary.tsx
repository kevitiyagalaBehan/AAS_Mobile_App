import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { colors } from "../src/theme/colors";

// Shared by the member detail screens (contribution caps, member balance)

export const memberKey = (name?: string) => (name ?? "").trim().toLowerCase();

type MemberTabsProps = {
  names: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  // Horizontal padding of the screen, so up to three tabs fill the width exactly
  gutter: number;
};

// One tab per member, styled like the Portfolio screen's segmented control.
// Up to three tabs share the width; more than that scroll sideways.
export function MemberTabs({ names, selectedIndex, onSelect, gutter }: MemberTabsProps) {
  const { width } = useWindowDimensions();
  const tabMinWidth = (width - gutter * 2 - 8) / Math.min(Math.max(names.length, 1), 3);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
    >
      {names.map((name, i) => {
        const selected = i === selectedIndex;
        const label = (name ?? "").trim() || "Member";
        return (
          <TouchableOpacity
            key={`tab-${i}`}
            style={[styles.tab, { minWidth: tabMinWidth }, selected && styles.tabSelected]}
            onPress={() => onSelect(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// White card of label/value rows. The navy title bar is optional, e.g. only
// shown when there's a single member and so no tabs naming them.
export function SummaryCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.summary}>
      {!!title && (
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryName} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
      {children}
    </View>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  // Shaded background for every other row within a section
  shaded?: boolean;
  // First row of a card with no title bar: drop the divider above it
  first?: boolean;
  bold?: boolean;
};

export function SummaryRow({ label, value, shaded, first, bold }: SummaryRowProps) {
  return (
    <View style={[styles.row, shaded && styles.rowAlt, first && styles.rowFirst]}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

export function SummarySection({ title, first }: { title: string; first?: boolean }) {
  return (
    <View style={[styles.section, first && styles.rowFirst]}>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    marginTop: 12,
    flexGrow: 0,
  },
  // Same segmented control look as the Portfolio screen's tabs
  tabBarContent: {
    flexGrow: 1,
    backgroundColor: "#E2E6EE",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabSelected: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: RFPercentage(1.9),
    fontWeight: "600",
    color: "#4B5563",
  },
  tabTextSelected: {
    color: colors.primary,
    fontWeight: "bold",
  },
  summary: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  summaryHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  summaryName: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowAlt: {
    backgroundColor: "#F5F6F8",
  },
  rowLabel: {
    flex: 1,
    fontSize: RFPercentage(1.8),
    color: "#374151",
    marginRight: 12,
  },
  rowValue: {
    fontSize: RFPercentage(1.85),
    fontWeight: "600",
    color: colors.primary,
    textAlign: "right",
  },
  bold: {
    fontWeight: "bold",
    color: colors.primary,
  },
  section: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: colors.primarySoft,
  },
  sectionText: {
    fontSize: RFPercentage(1.7),
    fontWeight: "bold",
    color: colors.primary,
    textTransform: "uppercase",
  },
});
