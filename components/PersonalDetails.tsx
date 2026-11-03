import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getClientProfile } from "../src/utils/pimsApi";
import { ClientProfile } from "../src/navigation/types";
import Card from "./Card";

export default function PersonalDetails({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const { userData } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await getClientProfile(
          userData.authToken,
          userData.accountId
        );
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setError("Failed to load personal details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  if (loading) {
    return <Text style={styles.muted}>Loading...</Text>;
  }

  if (error || !profile) {
    return (
      <Text style={styles.muted}>
        {error ?? "No personal details available"}
      </Text>
    );
  }

  const rows = [
    { label: "Portfolio Code", value: profile.superFundCode },
    { label: "Portfolio Name", value: profile.superFundName },
    { label: "Contact First Name", value: profile.contactNameFirst },
    { label: "Contact Last Name", value: profile.contactNameLast },
    { label: "Mailing Address 1", value: profile.maillingAddress1 },
    { label: "Mailing Address 2", value: profile.maillingAddress2 },
    { label: "Mailing Address 3", value: profile.maillingAddress3 },
  ];

  return (
    <Card>
      {rows.map(({ label, value }, index) => (
        <View key={label} style={[styles.row, index > 0 && styles.rowDivider]}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value || "—"}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: RFPercentage(1.9),
    color: "#6B7280",
    textAlign: "center",
    marginTop: 24,
  },
  row: {
    paddingVertical: 10,
  },
  rowDivider: {
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
});
