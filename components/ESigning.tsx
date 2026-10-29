import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getEsignDocuments } from "../src/utils/pimsApi";
import {
  EsignDocument,
  RootStackParamList,
  Signatory,
} from "../src/navigation/types";
import { useAuth } from "../src/context/AuthContext";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useRefreshTrigger } from "../hooks/useRefreshTrigger";
import Constants from "expo-constants";
import { colors } from "../src/theme/colors";
import { formatShortDate } from "../src/utils/format";

const docBaseUrl = Constants.expoConfig?.extra?.docBaseUrl as string;

type Tab = "toSign" | "all";

const needsSigning = (doc: EsignDocument) =>
  doc.signatories.some((s) => s.esigningStatus !== "Signed");

const SIGNATORY_STATUS = {
  Signed: { label: "Signed", icon: "checkmark-circle", color: "#15803D", bg: "#DCFCE7" },
  Viewed: { label: "Viewed", icon: "eye", color: "#A16207", bg: "#FEF9C3" },
  Pending: { label: "Pending", icon: "time", color: "#B91C1C", bg: "#FEE2E2" },
} as const;

const getSignatoryStatus = (s: Signatory) =>
  s.esigningStatus === "Signed"
    ? SIGNATORY_STATUS.Signed
    : s.esigningStatus === "Viewed"
    ? SIGNATORY_STATUS.Viewed
    : SIGNATORY_STATUS.Pending;

const getDueInfo = (dueDate?: string) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;
  const overdue = due.getTime() < new Date().setHours(0, 0, 0, 0);
  return { label: `${overdue ? "Overdue" : "Due"} ${formatShortDate(due)}`, overdue };
};

export default function ESigning() {
  const { userData } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [documents, setDocuments] = useState<EsignDocument[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab>("toSign");
  const [selectedDocument, setSelectedDocument] =
    useState<EsignDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const fetchData = async () => {
    if (!userData?.authToken || !userData?.accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getEsignDocuments(
        userData.authToken,
        userData.accountId
      );
      setDocuments(data || []);
    } catch (err) {
      setError("Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const { refreshTrigger, refreshing, onRefresh } =
    useRefreshTrigger(fetchData);

  useEffect(() => {
    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  const sorted = [...documents].sort(
    (a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
  );
  const toSignDocs = sorted.filter(needsSigning);
  const visibleDocs = selectedTab === "toSign" ? toSignDocs : sorted;

  const handleSign = (esigningDetailId: string) => {
    Linking.openURL(
      `${docBaseUrl}/ESigning/EmbeddedSigning.aspx?id=${esigningDetailId}`
    );
  };

  // PDFs open in the in-app viewer; signing itself stays in the browser above
  const handleView = (documentPath: string, title: string) => {
    const url = `${docBaseUrl}/${documentPath}`;
    if (/\.pdf$/i.test(documentPath.split("?")[0])) {
      navigation.navigate("PdfViewer", { url, title });
    } else {
      Linking.openURL(url);
    }
  };

  const renderDocument = ({ item }: { item: EsignDocument }) => {
    const pending = needsSigning(item);
    const signId = item.signatories.find((s) => s.esigningDetailId)
      ?.esigningDetailId;
    const documentPath = item.documents?.[0]?.documentPath;
    const due = pending ? getDueInfo(item.dueDate) : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedDocument(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View
            style={[styles.docIcon, pending ? styles.docIconPending : styles.docIconDone]}
          >
            <Ionicons
              name={pending ? "create-outline" : "checkmark-done"}
              size={20}
              color={pending ? "#C2410C" : "#15803D"}
            />
          </View>
          <View style={styles.cardTitleBox}>
            <Text style={styles.subject} numberOfLines={2}>
              {item.subject}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.sentBy ? `From ${item.sentBy} · ` : ""}
              {item.sentDate ? formatShortDate(item.sentDate) : ""}
            </Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {due && (
            <View style={[styles.dueBadge, due.overdue && styles.dueBadgeOverdue]}>
              <Text style={[styles.dueText, due.overdue && styles.dueTextOverdue]}>
                {due.label}
              </Text>
            </View>
          )}
          {!pending && (
            <View style={[styles.statusChip, { backgroundColor: SIGNATORY_STATUS.Signed.bg }]}>
              <Text style={[styles.statusChipText, { color: SIGNATORY_STATUS.Signed.color }]}>
                Completed
              </Text>
            </View>
          )}
        </View>

        <View style={styles.signatories}>
          {item.signatories.map((s, i) => {
            const status = getSignatoryStatus(s);
            return (
              <View key={`${s.signatoryEmail}-${i}`} style={styles.signatoryRow}>
                <Ionicons name={status.icon} size={16} color={status.color} />
                <Text style={styles.signatoryName} numberOfLines={1}>
                  {s.signatoryName}
                </Text>
                <Text style={[styles.signatoryStatus, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            );
          })}
        </View>

        {pending && signId ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleSign(signId)}
            accessibilityRole="button"
          >
            <Ionicons name="create" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Sign document</Text>
          </TouchableOpacity>
        ) : !pending && documentPath ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              handleView(
                documentPath,
                item.documents?.[0]?.documentName || item.subject
              )
            }
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>View document</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const detailRows = selectedDocument
    ? [
        { label: "Code", value: selectedDocument.esigningCode || "N/A" },
        {
          label: "Sent",
          value: selectedDocument.sentDate
            ? formatShortDate(selectedDocument.sentDate)
            : "N/A",
        },
        { label: "Sent by", value: selectedDocument.sentBy || "N/A" },
        { label: "Account", value: selectedDocument.accountName || "N/A" },
        {
          label: "Due",
          value: selectedDocument.dueDate
            ? formatShortDate(selectedDocument.dueDate)
            : "N/A",
        },
      ]
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {(
          [
            { key: "toSign", label: `To Sign (${toSignDocs.length})` },
            { key: "all", label: `All (${documents.length})` },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segment, selectedTab === tab.key && styles.segmentActive]}
            onPress={() => setSelectedTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === tab.key }}
          >
            <Text
              style={[
                styles.segmentText,
                selectedTab === tab.key && styles.segmentTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={visibleDocs}
          keyExtractor={(item, index) => `${item.esigningId || item.subject}-${index}`}
          renderItem={renderDocument}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons
                name={selectedTab === "toSign" ? "checkmark-done-circle-outline" : "documents-outline"}
                size={44}
                color="#9CA3AF"
              />
              <Text style={styles.emptyTitle}>
                {selectedTab === "toSign" ? "You're all caught up" : "No documents yet"}
              </Text>
              <Text style={styles.emptyText}>
                {selectedTab === "toSign"
                  ? "There are no documents waiting for your signature."
                  : "Documents sent to you for signing will appear here."}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedDocument}
        onRequestClose={() => setSelectedDocument(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDocument?.subject}</Text>
              <TouchableOpacity
                onPress={() => setSelectedDocument(null)}
                hitSlop={10}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {detailRows.map((row) => (
              <View key={row.label} style={styles.modalRow}>
                <Text style={styles.modalLabel}>{row.label}</Text>
                <Text style={styles.modalValue}>{row.value}</Text>
              </View>
            ))}

            <Text style={styles.modalSection}>Signatories</Text>
            {selectedDocument?.signatories.map((s, i) => {
              const status = getSignatoryStatus(s);
              return (
                <View key={`${s.signatoryEmail}-${i}`} style={styles.signatoryRow}>
                  <Ionicons name={status.icon} size={16} color={status.color} />
                  <Text style={styles.signatoryName} numberOfLines={1}>
                    {s.signatoryName}
                  </Text>
                  <Text style={[styles.signatoryStatus, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.primaryButton, styles.closeButton]}
              onPress={() => setSelectedDocument(null)}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: "#E2E6EE",
      borderRadius: 12,
      padding: 4,
      marginHorizontal: width * 0.01,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
    },
    segmentActive: {
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    segmentText: {
      fontSize: RFPercentage(1.9),
      color: "#4B5563",
      fontWeight: "600",
    },
    segmentTextActive: {
      color: colors.primary,
      fontWeight: "bold",
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: width * 0.01,
      paddingBottom: height * 0.03,
    },
    muted: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
      marginTop: height * 0.05,
    },
    errorText: {
      color: "#B91C1C",
      fontSize: RFPercentage(2),
      textAlign: "center",
      marginTop: height * 0.05,
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      padding: 16,
      marginTop: 12,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    docIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    docIconPending: {
      backgroundColor: "#FFEDD5",
    },
    docIconDone: {
      backgroundColor: "#DCFCE7",
    },
    cardTitleBox: {
      flex: 1,
    },
    subject: {
      fontSize: RFPercentage(2.1),
      fontWeight: "bold",
      color: colors.primary,
    },
    meta: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 2,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    dueBadge: {
      backgroundColor: "#FFEDD5",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    dueBadgeOverdue: {
      backgroundColor: "#FEE2E2",
    },
    dueText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "bold",
      color: "#C2410C",
    },
    dueTextOverdue: {
      color: "#B91C1C",
    },
    statusChip: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusChipText: {
      fontSize: RFPercentage(1.6),
      fontWeight: "bold",
    },
    signatories: {
      marginTop: 10,
      paddingTop: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "#E5E7EB",
    },
    signatoryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
    },
    signatoryName: {
      flex: 1,
      fontSize: RFPercentage(1.8),
      color: "#111827",
      marginLeft: 8,
    },
    signatoryStatus: {
      fontSize: RFPercentage(1.7),
      fontWeight: "600",
    },
    primaryButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 12,
    },
    primaryButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    secondaryButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 11,
      marginTop: 12,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: width * 0.1,
      marginTop: height * 0.08,
    },
    emptyTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 10,
    },
    emptyText: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      textAlign: "center",
      marginTop: 4,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      width: width * 0.88,
      backgroundColor: "white",
      borderRadius: 16,
      padding: width * 0.05,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 8,
    },
    modalTitle: {
      flex: 1,
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
      color: colors.primary,
    },
    modalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    modalLabel: {
      fontSize: RFPercentage(1.9),
      color: "#6B7280",
    },
    modalValue: {
      flexShrink: 1,
      textAlign: "right",
      marginLeft: 12,
      fontSize: RFPercentage(1.9),
      fontWeight: "600",
      color: "#111827",
    },
    modalSection: {
      fontSize: RFPercentage(1.9),
      fontWeight: "bold",
      color: colors.primary,
      marginTop: 14,
      marginBottom: 2,
    },
    closeButton: {
      marginTop: 18,
    },
  });
