import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import { getEsignDocuments, getMessages } from "../src/utils/pimsApi";
import { formatShortDate } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";

type CardContent = {
  icon: "create-outline" | "chatbubble-ellipses-outline";
  title: string;
  from: string;
  date: number;
  onPress: () => void;
};

const formatWhen = (timestamp: number) => {
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
    : formatShortDate(date);
};

// Shows the latest document waiting for signature; if there is none, the
// latest Inbox message from AAS. Hidden when there is neither.
export default function HomeMessageCard({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const { userData } = useAuth();
  const navigation = useNavigation<any>();
  const [content, setContent] = useState<CardContent | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userData?.authToken || !userData?.accountId) return;
      const { authToken, accountId } = userData;

      const documents = await getEsignDocuments(authToken, accountId);
      const toSign = (documents || [])
        .filter((doc) =>
          doc.signatories.some((s) => s.esigningStatus !== "Signed")
        )
        .sort(
          (a, b) =>
            new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
        )[0];

      if (toSign) {
        setContent({
          icon: "create-outline",
          title: `Ready to sign: ${toSign.subject}`,
          from: toSign.sentBy || toSign.companyName || "AAS",
          date: new Date(toSign.sentDate).getTime(),
          onPress: () => navigation.navigate("ESigning"),
        });
        return;
      }

      try {
        const messages = await getMessages(authToken, accountId);
        const latest = (messages || [])
          .filter((msg) => msg.fromPIMS)
          .sort((a, b) => b.uploadedDate - a.uploadedDate)[0];

        setContent(
          latest
            ? {
                icon: "chatbubble-ellipses-outline",
                title: `New message: ${latest.description}`,
                from: latest.uploadedBy || "AAS",
                date: latest.uploadedDate,
                onPress: () =>
                  navigation.navigate("Inbox", {
                    screen: "InboxDetail",
                    params: { queryId: latest.id, title: latest.description },
                    // Keep the Inbox list underneath so back returns to it
                    initial: false,
                  }),
              }
            : null
        );
      } catch {
        setContent(null);
      }
    };

    load();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  if (!content) return null;

  return (
    <TouchableOpacity
      onPress={content.onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Card style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name={content.icon} size={22} color="#C2410C" />
        </View>
        <View style={styles.textBox}>
          <Text style={styles.title} numberOfLines={2}>
            {content.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            From {content.from} · {formatWhen(content.date)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textBox: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: RFPercentage(2),
    fontWeight: "bold",
    color: colors.primary,
  },
  subtitle: {
    fontSize: RFPercentage(1.7),
    color: "#6B7280",
    marginTop: 2,
  },
});
