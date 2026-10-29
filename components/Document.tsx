import React, { ComponentProps, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Base64 } from "js-base64";
import { useAuth } from "../src/context/AuthContext";
import {
  getAASDocuments,
  getFolderPath,
  getDocumentViewUrl,
  getAASDocumentRoot,
} from "../src/utils/pimsApi";
import { Documents, Folders, RootStackParamList } from "../src/navigation/types";
import { formatShortDate } from "../src/utils/format";
import { colors } from "../src/theme/colors";
import Card from "./Card";
import DetailModal from "./DetailModal";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
type Tab = "aasFolders" | "aasDocuments";

const TABS: { key: Tab; label: string }[] = [
  { key: "aasFolders", label: "AAS Folders" },
  { key: "aasDocuments", label: "AAS Documents" },
];

type FileIcon = { name: MaterialIconName; color: string; background: string };

const FOLDER_ICON: FileIcon = { name: "folder", color: "#D97706", background: "#FEF3C7" };

// Folders give "pdf", documents give ".pdf"
const getFileIcon = (extension?: string | null): FileIcon => {
  switch (extension?.replace(".", "").toLowerCase()) {
    case "pdf":
      return { name: "picture-as-pdf", color: "#D32F2F", background: "#FEE2E2" };
    case "doc":
    case "docx":
      return { name: "description", color: "#2A5699", background: "#DBEAFE" };
    case "xls":
    case "xlsx":
      return { name: "grid-on", color: "#1B8836", background: "#DCFCE7" };
    default:
      return { name: "insert-drive-file", color: "#6B7280", background: "#F3F4F6" };
  }
};

export default function Document({ refreshTrigger }: { refreshTrigger: number }) {
  const { userData } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();
  const styles = getStyles(height);

  const [selectedTab, setSelectedTab] = useState<Tab>("aasFolders");
  const [rootPath, setRootPath] = useState<string>("");
  const [rootError, setRootError] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folders[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Documents[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Documents | null>(null);

  const currentPath = rootPath ? [rootPath, ...folderStack].join("/") : "";

  // A different account has a different document root
  useEffect(() => {
    setRootPath("");
    setFolderStack([]);
  }, [userData?.accountId]);

  // Pull-to-refresh retries this only while the root hasn't loaded
  useEffect(() => {
    if (rootPath || !userData?.authToken || !userData?.accountId) return;
    let cancelled = false;

    const loadRoot = async () => {
      setRootError(null);
      try {
        const root = await getAASDocumentRoot(userData.accountId, userData.authToken);
        if (cancelled) return;
        if (root) {
          setRootPath(root);
        } else {
          setRootError("No documents are available for this account.");
        }
      } catch {
        if (!cancelled) setRootError("Failed to load documents. Pull down to try again.");
      }
    };

    loadRoot();
    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, userData?.accountId, refreshTrigger, rootPath]);

  useEffect(() => {
    if (!currentPath || !userData?.authToken) return;
    let cancelled = false;

    const loadFolders = async () => {
      setFoldersLoading(true);
      setFoldersError(null);
      try {
        const data = await getFolderPath(currentPath, userData.authToken);
        if (!cancelled) setFolders(data || []);
      } catch {
        if (!cancelled) setFoldersError("Failed to load folders");
      } finally {
        if (!cancelled) setFoldersLoading(false);
      }
    };

    loadFolders();
    return () => {
      cancelled = true;
    };
  }, [currentPath, userData?.authToken, refreshTrigger]);

  useEffect(() => {
    if (!currentPath || !userData?.authToken) return;
    let cancelled = false;

    const loadDocuments = async () => {
      setDocumentsLoading(true);
      setDocumentsError(null);
      try {
        const data = await getAASDocuments(currentPath, userData.authToken);
        if (!cancelled) setDocuments(data || []);
      } catch {
        if (!cancelled) setDocumentsError("Failed to load documents");
      } finally {
        if (!cancelled) setDocumentsLoading(false);
      }
    };

    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [currentPath, userData?.authToken, refreshTrigger]);

  const openDocument = async (
    filePath: string,
    key: string,
    name: string,
    extension?: string | null
  ) => {
    if (!userData?.authToken) {
      Alert.alert("Error", "User is not authenticated.");
      return;
    }
    if (openingKey) return;

    // PDFs open in the in-app viewer; other types still go to the browser
    if (extension?.replace(".", "").toLowerCase() === "pdf") {
      navigation.navigate("PdfViewer", { path: filePath, title: name });
      return;
    }

    setOpeningKey(key);
    try {
      const docUrl = await getDocumentViewUrl(
        Base64.encode(filePath),
        userData.authToken
      );
      if (docUrl) {
        await Linking.openURL(docUrl);
      } else {
        Alert.alert("Error", "Unable to retrieve document URL.");
      }
    } catch {
      Alert.alert("Error", "Failed to open the document.");
    } finally {
      setOpeningKey(null);
    }
  };

  const handleFolderPress = (item: Folders) => {
    if (item.type === "FOLDER") {
      setFolderStack((prev) => [...prev, item.name]);
    } else if (item.type === "FILE") {
      openDocument(
        `${currentPath}/${item.name}`,
        `folder-${item.name}`,
        item.name,
        item.fileType
      );
    }
  };

  const renderIcon = (icon: FileIcon) => (
    <View style={[styles.iconBox, { backgroundColor: icon.background }]}>
      <MaterialIcons name={icon.name} size={20} color={icon.color} />
    </View>
  );

  const renderTrailing = (key: string, chevron = true) =>
    openingKey === key ? (
      <ActivityIndicator size="small" color={colors.primary} />
    ) : chevron ? (
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    ) : null;

  const renderState = (
    loading: boolean,
    error: string | null,
    isEmpty: boolean,
    emptyText: string
  ) => {
    if (loading) {
      return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
    }
    if (error) {
      return (
        <Card>
          <Text style={styles.stateText}>{error}</Text>
        </Card>
      );
    }
    if (isEmpty) {
      return (
        <Card>
          <Text style={styles.stateText}>{emptyText}</Text>
        </Card>
      );
    }
    return null;
  };

  const renderBreadcrumbs = () => (
    <View style={styles.breadcrumbRow}>
      {folderStack.length > 0 && (
        <TouchableOpacity
          style={styles.upButton}
          onPress={() => setFolderStack((prev) => prev.slice(0, -1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Up one folder"
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.breadcrumbs}>
          {["Home", ...folderStack].map((name, idx) => {
            const isCurrent = idx === folderStack.length;
            return (
              <View key={`${idx}-${name}`} style={styles.crumb}>
                {idx > 0 && (
                  <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                )}
                <TouchableOpacity
                  disabled={isCurrent}
                  onPress={() => setFolderStack((prev) => prev.slice(0, idx))}
                  hitSlop={6}
                >
                  <Text style={[styles.crumbText, isCurrent && styles.crumbCurrent]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderFolders = () =>
    renderState(
      foldersLoading,
      foldersError,
      folders.length === 0,
      "This folder is empty."
    ) ?? (
      <Card style={styles.listCard}>
        {folders.map((item, idx) => {
          const isFolder = item.type === "FOLDER";
          const key = `folder-${item.name}`;
          return (
            <TouchableOpacity
              key={`${item.type}-${item.name}-${idx}`}
              style={[styles.row, idx > 0 && styles.rowDivider]}
              onPress={() => handleFolderPress(item)}
              activeOpacity={0.6}
            >
              {renderIcon(isFolder ? FOLDER_ICON : getFileIcon(item.fileType))}
              <View style={styles.rowMain}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                {!!item.lastModifiedDate && (
                  <Text style={styles.meta}>
                    {formatShortDate(item.lastModifiedDate)}
                  </Text>
                )}
              </View>
              {renderTrailing(key)}
            </TouchableOpacity>
          );
        })}
      </Card>
    );

  const renderDocuments = () =>
    renderState(
      documentsLoading,
      documentsError,
      documents.length === 0,
      "No documents yet."
    ) ?? (
      <Card style={styles.listCard}>
        {documents.map((item, idx) => {
          const key = `doc-${item.id}`;
          return (
            <View key={item.id} style={[styles.row, idx > 0 && styles.rowDivider]}>
              <TouchableOpacity
                style={styles.rowPressable}
                onPress={() =>
                  openDocument(item.fullPath, key, item.name, item.extension)
                }
                activeOpacity={0.6}
              >
                {renderIcon(getFileIcon(item.extension))}
                <View style={styles.rowMain}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[
                      item.lastModified && formatShortDate(item.lastModified),
                      item.sizeText,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                {renderTrailing(key, false)}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedItem(item)}
                hitSlop={10}
                style={styles.infoButton}
                accessibilityRole="button"
                accessibilityLabel={`Details for ${item.name}`}
              >
                <Ionicons name="information-circle-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          );
        })}
      </Card>
    );

  return (
    <View>
      <View style={styles.segmentedControl}>
        {TABS.map((tab) => {
          const selected = selectedTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.segment, selected && styles.segmentActive]}
              onPress={() => setSelectedTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {rootError ? (
        <Card>
          <Text style={styles.stateText}>{rootError}</Text>
        </Card>
      ) : !rootPath ? (
        <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
      ) : selectedTab === "aasFolders" ? (
        <>
          {renderBreadcrumbs()}
          {renderFolders()}
        </>
      ) : (
        <>
          {!documentsLoading && !documentsError && documents.length > 0 && (
            <Text style={styles.countText}>
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </Text>
          )}
          {renderDocuments()}
        </>
      )}

      <DetailModal
        visible={!!selectedItem}
        title={selectedItem?.name ?? ""}
        rows={[
          {
            label: "Modified",
            value: selectedItem?.lastModified
              ? formatShortDate(selectedItem.lastModified)
              : null,
          },
          { label: "Folder", value: selectedItem?.folder },
          { label: "Size", value: selectedItem?.sizeText },
        ]}
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

const getStyles = (height: number) =>
  StyleSheet.create({
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: "#E2E6EE",
      borderRadius: 12,
      padding: 4,
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
    spinner: {
      marginTop: height * 0.08,
    },
    stateText: {
      textAlign: "center",
      color: "#6B7280",
      fontSize: RFPercentage(1.9),
    },
    breadcrumbRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      paddingHorizontal: 4,
    },
    upButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    breadcrumbs: {
      flexDirection: "row",
      alignItems: "center",
    },
    crumb: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginRight: 4,
    },
    crumbText: {
      fontSize: RFPercentage(1.9),
      color: colors.link,
      fontWeight: "600",
    },
    crumbCurrent: {
      color: colors.primary,
      fontWeight: "bold",
    },
    countText: {
      fontSize: RFPercentage(1.8),
      color: "#6B7280",
      marginTop: 14,
      paddingHorizontal: 4,
    },
    listCard: {
      paddingVertical: 0,
      paddingHorizontal: 0,
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
    rowPressable: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    rowMain: {
      flex: 1,
      marginRight: 8,
    },
    name: {
      fontSize: RFPercentage(2),
      fontWeight: "600",
      color: "#111827",
    },
    meta: {
      fontSize: RFPercentage(1.7),
      color: "#6B7280",
      marginTop: 2,
    },
    infoButton: {
      marginLeft: 8,
    },
  });
