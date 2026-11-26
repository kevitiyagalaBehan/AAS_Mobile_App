import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useRefreshTrigger } from "../../hooks/useRefreshTrigger";
import { useAdviserBadges } from "../context/AdviserBadgeContext";
import {
  AdviserHeader,
  AdviserJobSummary,
  AdviserInvestmentOverview,
} from "../../components";
import { colors } from "../theme/colors";

type Section = "jobs" | "investments";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "jobs", label: "Job Summary" },
  { key: "investments", label: "Investment Overview" },
];

export default function AdviserHomeScreen() {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);
  const { refreshCounts } = useAdviserBadges();
  const onRefreshCounts = useCallback(() => refreshCounts(), [refreshCounts]);
  const { refreshTrigger, refreshing, onRefresh } = useRefreshTrigger(onRefreshCounts);
  const [section, setSection] = useState<Section>("jobs");

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AdviserHeader />

        <View style={styles.sectionTabs} accessibilityRole="tablist">
          {SECTIONS.map(({ key, label }) => {
            const selected = key === section;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.sectionTab, selected && styles.sectionTabSelected]}
                onPress={() => setSection(key)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.sectionTabText, selected && styles.sectionTabTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {section === "jobs" ? (
          <AdviserJobSummary refreshTrigger={refreshTrigger} />
        ) : (
          <AdviserInvestmentOverview refreshTrigger={refreshTrigger} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#eee",
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: width * 0.03,
      paddingBottom: height * 0.02,
    },
    sectionTabs: {
      flexDirection: "row",
      gap: 8,
      marginBottom: height * 0.015,
    },
    sectionTab: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#D9DEE7",
    },
    sectionTabSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sectionTabText: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: colors.primary,
    },
    sectionTabTextSelected: {
      color: "#fff",
    },
  });
