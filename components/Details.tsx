import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../src/context/AuthContext";
import {
  getClientAccountDetails,
  getRelationships,
} from "../src/utils/pimsApi";
import {
  ClientAccountDetails,
  Props,
  RelationshipResponse,
} from "../src/navigation/types";
import { RFPercentage } from "react-native-responsive-fontsize";
import { formatShortDate } from "../src/utils/format";
import { avatarFor } from "../src/utils/messageFormat";
import { colors } from "../src/theme/colors";
import Card from "./Card";

type Tab = "accountDetails" | "relationships";

const TABS: { key: Tab; label: string }[] = [
  { key: "accountDetails", label: "Account details" },
  { key: "relationships", label: "Relationships" },
];

export default function Details({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [relationshipsLoading, setRelationshipsLoading] = useState(true);
  const [details, setDetails] = useState<ClientAccountDetails[] | null>(null);
  const [relationships, setRelationships] = useState<
    RelationshipResponse[] | null
  >(null);
  const [selectedTab, setSelectedTab] = useState<Tab>("accountDetails");
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [relationshipsError, setRelationshipsError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchDetails = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setDetailsLoading(false);
        return;
      }

      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const data = await getClientAccountDetails(
          userData.authToken,
          userData.accountId
        );
        setDetails(data);
      } catch {
        setDetailsError("Failed to load account details");
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  useEffect(() => {
    const fetchRelationships = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setRelationshipsLoading(false);
        return;
      }

      setRelationshipsLoading(true);
      setRelationshipsError(null);
      try {
        const data = await getRelationships(
          userData.authToken,
          userData.accountId
        );
        setRelationships(data);
      } catch {
        setRelationshipsError("Failed to load relationships");
      } finally {
        setRelationshipsLoading(false);
      }
    };

    fetchRelationships();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const renderAccountDetails = () => {
    if (detailsLoading) return <Text style={styles.muted}>Loading...</Text>;
    if (detailsError) return <Text style={styles.muted}>{detailsError}</Text>;

    const account = details?.[0];
    if (!account) {
      return <Text style={styles.muted}>No account details available</Text>;
    }

    const rows = [
      { label: "Portfolio Code", value: account.superFundCode },
      { label: "Account Name", value: account.superFundName },
      { label: "Legal Type", value: account.legalType },
      { label: "Trustee(s)", value: account.trusteeName },
      { label: "Job Type", value: account.jobType },
      { label: "ABN", value: account.fundABN },
      { label: "TFN", value: account.fundTFN || "<<Recorded>>" },
      {
        label: "SOA Date",
        value: account.soaDate ? formatShortDate(account.soaDate) : null,
      },
      {
        label: "Fund Start Date",
        value: account.fundStartDate
          ? formatShortDate(account.fundStartDate)
          : null,
      },
      { label: "Adviser", value: account.adviserName },
    ];

    return (
      <Card>
        {rows.map(({ label, value }, index) => (
          <View key={label} style={[styles.row, index > 0 && styles.divider]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || "—"}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderRelationships = () => {
    if (relationshipsLoading) {
      return <Text style={styles.muted}>Loading...</Text>;
    }
    if (relationshipsError) {
      return <Text style={styles.muted}>{relationshipsError}</Text>;
    }
    if (!relationships || relationships.length === 0) {
      return <Text style={styles.muted}>No relationships available</Text>;
    }

    return (
      <Card style={styles.listCard}>
        {relationships.map((person, index) => {
          const avatar = avatarFor(person.accountName || "?");
          return (
            <View
              key={person.id}
              style={[styles.personRow, index > 0 && styles.divider]}
            >
              <View style={[styles.avatar, { backgroundColor: avatar.color }]}>
                <Text
                  style={styles.avatarText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {avatar.initials}
                </Text>
              </View>
              <View style={styles.personText}>
                <Text style={styles.personName}>{person.accountName}</Text>
                {!!person.email && (
                  <Text style={styles.personContact} numberOfLines={1}>
                    {person.email}
                  </Text>
                )}
                {!!person.mobile && (
                  <Text style={styles.personContact} numberOfLines={1}>
                    {person.mobile}
                  </Text>
                )}
                <View style={styles.roles}>
                  {person.relationships.map((r, i) => (
                    <View key={`${r.relationship}-${i}`} style={styles.roleChip}>
                      <Text style={styles.roleText}>{r.relationship}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmented} accessibilityRole="tablist">
        {TABS.map(({ key, label }) => {
          const selected = selectedTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segment, selected && styles.segmentSelected]}
              onPress={() => setSelectedTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.segmentText, selected && styles.segmentTextSelected]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedTab === "accountDetails"
        ? renderAccountDetails()
        : renderRelationships()}
    </View>
  );
}

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#E2E6EE",
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: {
    fontSize: RFPercentage(1.9),
    fontWeight: "600",
    color: "#4B5563",
  },
  segmentTextSelected: {
    color: colors.primary,
    fontWeight: "bold",
  },
  muted: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
    textAlign: "center",
    marginTop: 24,
  },
  row: {
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  label: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
  },
  value: {
    fontSize: RFPercentage(2),
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  listCard: {
    paddingVertical: 4,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: RFPercentage(1.8),
  },
  personText: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: "#111827",
  },
  personContact: {
    fontSize: RFPercentage(1.7),
    color: "#4B5563",
    marginTop: 1,
  },
  roles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  roleChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: RFPercentage(1.6),
    fontWeight: "600",
    color: colors.primary,
  },
});
