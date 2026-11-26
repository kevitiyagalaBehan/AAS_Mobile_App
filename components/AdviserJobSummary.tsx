import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Card from "./Card";
import { useAuth } from "../src/context/AuthContext";
import { getAdviserJobSummary } from "../src/utils/adviserApi";
import { AdviserJobSummary as JobSummaryData, JobPhase } from "../src/navigation/types";
import { colors } from "../src/theme/colors";
import {
  findCurrentFinancialYear,
  recentFinancialYears,
} from "../src/utils/financialYear";

const PHASES: { phase: JobPhase; label: string; color: string }[] = [
  { phase: "notStarted", label: "Not started", color: "#8FA9D9" },
  { phase: "inProgress", label: "In progress", color: "#F5B700" },
  { phase: "lodged", label: "Lodged", color: "#5BCB5B" },
];

type Props = { refreshTrigger: number };

export default function AdviserJobSummary({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  // null on first load: the server's default year is fetched, and then the current
  // financial year is selected if the server's default was a different one
  const [financialYearId, setFinancialYearId] = useState<number | null>(null);
  const [data, setData] = useState<JobSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userData?.authToken) return;
    let cancelled = false;

    setLoading(true);
    setError(false);
    getAdviserJobSummary(userData.authToken, financialYearId).then((result) => {
      if (cancelled) return;

      if (result && financialYearId === null) {
        const current = findCurrentFinancialYear(result.availableFinancialYears);
        if (current && current.id !== result.financialYear.id) {
          // Keeps the spinner up while the current year loads
          setFinancialYearId(current.id);
          return;
        }
      }

      if (result) setData(result);
      else setError(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, financialYearId, refreshTrigger]);

  if (!data) {
    return (
      <View style={styles.placeholder}>
        {error ? (
          <Text style={styles.errorText}>Couldn't load the job summary.</Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  // Each job is counted once, in the phase of the stage it's at
  const phaseOfStage = new Map(data.stages.map((s) => [s.code, s.phase]));
  const stageTotals = new Map<string, number>();
  const phaseTotals: Record<JobPhase, number> = { notStarted: 0, inProgress: 0, lodged: 0 };

  data.jobTypes.forEach((jobType) => {
    Object.entries(jobType.stageCounts).forEach(([code, count]) => {
      stageTotals.set(code, (stageTotals.get(code) ?? 0) + count);
      const phase = phaseOfStage.get(code);
      if (phase && phase in phaseTotals) phaseTotals[phase] += count;
    });
  });

  const totalJobs = phaseTotals.notStarted + phaseTotals.inProgress + phaseTotals.lodged;
  const inProgressStages = data.stages
    .filter((s) => s.phase === "inProgress")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const jobTypes = data.jobTypes
    .filter((j) => j.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <View style={loading && styles.dimmed}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>Total jobs</Text>
            <Text style={styles.summaryValue}>{totalJobs}</Text>
          </View>

          <View style={styles.yearToggle} accessibilityRole="tablist">
            {recentFinancialYears(data.availableFinancialYears).map((fy) => {
              const selected = fy.id === data.financialYear.id;
              return (
                <TouchableOpacity
                  key={fy.id}
                  style={[styles.yearOption, selected && styles.yearOptionSelected]}
                  onPress={() => setFinancialYearId(fy.id)}
                  disabled={loading || selected}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.yearText, selected && styles.yearTextSelected]}>
                    {fy.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {totalJobs > 0 && (
          <View style={styles.bar}>
            {PHASES.filter(({ phase }) => phaseTotals[phase] > 0).map(({ phase, color }) => (
              <View
                key={phase}
                style={[styles.barSegment, { flex: phaseTotals[phase], backgroundColor: color }]}
              />
            ))}
          </View>
        )}

        <View style={styles.tiles}>
          {PHASES.map(({ phase, label, color }) => (
            <View key={phase} style={styles.tile}>
              <View style={styles.tileValueRow}>
                <View style={[styles.tileDot, { backgroundColor: color }]} />
                <Text style={styles.tileValue}>{phaseTotals[phase]}</Text>
              </View>
              <Text style={styles.tileLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Card>
        <Text style={styles.cardTitle}>In progress by stage</Text>
        {inProgressStages.map((stage, i) => (
          <View key={stage.code} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
            <Text style={styles.listLabel}>{stage.name}</Text>
            <Text style={styles.listValue}>{stageTotals.get(stage.code) ?? 0}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Jobs by type</Text>
        {jobTypes.length === 0 ? (
          <Text style={styles.emptyText}>No jobs for {data.financialYear.label}.</Text>
        ) : (
          jobTypes.map((jobType, i) => (
            <View
              key={jobType.jobTypeName}
              style={[styles.listRow, i > 0 && styles.listRowBorder]}
            >
              <Text style={[styles.listLabel, styles.jobTypeLabel]}>
                {jobType.jobTypeName}
              </Text>
              <Text style={styles.listValue}>{jobType.total}</Text>
            </View>
          ))
        )}
      </Card>
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
    dimmed: {
      opacity: 0.6,
    },
    summaryCard: {
      backgroundColor: colors.primary,
      borderRadius: 18,
      paddingHorizontal: width * 0.045,
      paddingVertical: height * 0.02,
    },
    summaryTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
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
    yearToggle: {
      flexDirection: "row",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 12,
      padding: 4,
    },
    yearOption: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 9,
    },
    yearOptionSelected: {
      backgroundColor: "#fff",
    },
    yearText: {
      fontSize: RFPercentage(1.8),
      fontWeight: "bold",
      color: "#C9D3E6",
    },
    yearTextSelected: {
      color: colors.primary,
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
    tiles: {
      flexDirection: "row",
      gap: 8,
      marginTop: height * 0.015,
    },
    tile: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    tileValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    tileDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    tileValue: {
      fontSize: RFPercentage(2.8),
      fontWeight: "bold",
      color: "#fff",
    },
    tileLabel: {
      fontSize: RFPercentage(1.6),
      color: "#C9D3E6",
      marginTop: 2,
    },
    cardTitle: {
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 6,
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
    listLabel: {
      flex: 1,
      fontSize: RFPercentage(1.9),
      color: "#1F2937",
    },
    jobTypeLabel: {
      fontWeight: "600",
    },
    listValue: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: colors.primary,
    },
    emptyText: {
      fontSize: RFPercentage(1.9),
      color: "#6B7280",
      paddingVertical: 8,
    },
  });
