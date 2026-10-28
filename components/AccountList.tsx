import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { getAccountList } from "../src/utils/pimsApi";
import {
  AccountEntity,
  AccountIndividual,
  Props,
} from "../src/navigation/types";
import { colors } from "../src/theme/colors";
import Card from "./Card";
import DetailModal, { DetailRow } from "./DetailModal";

type Selected = { title: string; subtitle?: string; rows: DetailRow[] } | null;

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${parts[0][0]}${last}`.toUpperCase();
};

// People and entities in the family group, each opening a details popup
export default function AccountList({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const [entities, setEntities] = useState<AccountEntity[]>([]);
  const [individuals, setIndividuals] = useState<AccountIndividual[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Selected>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { entities, individuals } = await getAccountList(
          userData.authToken,
          userData.accountId
        );
        setEntities(entities);
        setIndividuals(individuals);
      } catch (err) {
        setError("Failed to load client account details");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const openIndividual = (ind: AccountIndividual) =>
    setSelected({
      title: ind.accountName,
      subtitle: ind.relationship,
      rows: [
        { label: "Email", value: ind.email },
        { label: "DOB (age)", value: ind.dob },
        { label: "Relationship", value: ind.relationship },
      ],
    });

  const openEntity = (ent: AccountEntity) =>
    setSelected({
      title: ent.accountName,
      subtitle: ent.accountType,
      rows: [
        { label: "Entity type", value: ent.accountType },
        { label: "ABN", value: ent.abn },
        { label: "TFN", value: ent.tfn },
        { label: "Active portfolio", value: ent.activePortfolio },
      ],
    });

  const renderRow = (
    key: string,
    avatar: React.ReactNode,
    name: string,
    meta: string,
    onPress: () => void,
    isLast: boolean
  ) => (
    <TouchableOpacity
      key={key}
      style={[styles.row, isLast && styles.lastRow]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {avatar}
      <View style={styles.rowText}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {!!meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const isEmpty = individuals.length === 0 && entities.length === 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Account list</Text>
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : error ? (
        <Text style={styles.muted}>{error}</Text>
      ) : isEmpty ? (
        <Text style={styles.muted}>No client account details available</Text>
      ) : (
        <>
          {individuals.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                Individuals ({individuals.length})
              </Text>
              {individuals.map((ind, idx) =>
                renderRow(
                  ind.id,
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(ind.accountName)}
                    </Text>
                  </View>,
                  ind.accountName,
                  [ind.relationship, ind.dob].filter(Boolean).join(" · "),
                  () => openIndividual(ind),
                  idx === individuals.length - 1
                )
              )}
            </>
          )}

          {entities.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Entities ({entities.length})</Text>
              {entities.map((ent, idx) =>
                renderRow(
                  ent.id,
                  <View style={[styles.avatar, styles.entityAvatar]}>
                    <Ionicons name="business" size={18} color={colors.primary} />
                  </View>,
                  ent.accountName,
                  [ent.accountType, ent.abn ? `ABN ${ent.abn}` : ""]
                    .filter(Boolean)
                    .join(" · "),
                  () => openEntity(ent),
                  idx === entities.length - 1
                )
              )}
            </>
          )}
        </>
      )}

      <DetailModal
        visible={!!selected}
        title={selected?.title ?? ""}
        subtitle={selected?.subtitle}
        rows={selected?.rows ?? []}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    color: colors.primary,
  },
  muted: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: RFPercentage(1.9),
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: RFPercentage(1.6),
    fontWeight: "bold",
    color: "#6B7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  entityAvatar: {
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: RFPercentage(1.7),
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  meta: {
    fontSize: RFPercentage(1.6),
    color: "#6B7280",
    marginTop: 2,
  },
});
