import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { Base64 } from "js-base64";
import { useAuth } from "../context/AuthContext";
import { getDocumentViewUrl } from "../utils/pimsApi";
import { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

// Saved under the document's own name so a shared file keeps it; each open overwrites it
const toCacheFileName = (title: string) => {
  const safe = title.replace(/[^\w.\- ]/g, "_").trim() || "document";
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
};

export default function PdfViewerScreen() {
  const navigation = useNavigation();
  const params = useRoute<RouteProp<RootStackParamList, "PdfViewer">>().params;
  const { title } = params;
  const path = "path" in params ? params.path : null;
  const directUrl = "url" in params ? params.url : null;
  const { userData } = useAuth();

  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [localFile, setLocalFile] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  // The view link can expire, so Retry fetches a fresh one
  useEffect(() => {
    let cancelled = false;

    const loadUrl = async () => {
      setUri(null);
      setError(null);
      setLocalFile(null);
      setPageCount(0);
      if (directUrl) {
        setUri(directUrl);
        return;
      }
      if (!path || !userData?.authToken) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      const url = await getDocumentViewUrl(Base64.encode(path), userData.authToken);
      if (cancelled) return;
      if (url) setUri(url.trim());
      else setError("Couldn't open this document.");
    };

    loadUrl();
    return () => {
      cancelled = true;
    };
  }, [path, directUrl, userData?.authToken, attempt]);

  const share = async () => {
    if (!localFile) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing unavailable", "Sharing isn't available on this device.");
      return;
    }
    try {
      await Sharing.shareAsync(
        localFile.startsWith("file://") ? localFile : `file://${localFile}`,
        { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: title }
      );
    } catch {
      Alert.alert("Error", "Couldn't share this document.");
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={RFPercentage(3)} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          <TouchableOpacity
            onPress={share}
            disabled={!localFile}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share or save"
          >
            <Ionicons
              name="share-outline"
              size={RFPercentage(2.8)}
              color={localFile ? colors.primary : "#C4C9D2"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {error ? (
            <View style={styles.centre}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setAttempt((n) => n + 1)}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !uri ? (
            <View style={styles.centre}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <Pdf
              key={attempt}
              source={{ uri, cache: false, cacheFileName: toCacheFileName(title) }}
              trustAllCerts={false}
              style={styles.pdf}
              renderActivityIndicator={() => (
                <ActivityIndicator size="large" color={colors.primary} />
              )}
              onLoadComplete={(pages, filePath) => {
                setPageCount(pages);
                setLocalFile(filePath);
              }}
              onPageChanged={(current, total) => {
                setPage(current);
                setPageCount(total);
              }}
              onError={(err) => {
                console.error("PDF failed to load:", err);
                setError("Couldn't open this document.");
              }}
            />
          )}

          {!error && pageCount > 0 && (
            <View style={styles.pageBadge} pointerEvents="none">
              <Text style={styles.pageText}>
                Page {page} of {pageCount}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    flex: 1,
    fontSize: RFPercentage(2.2),
    fontWeight: "bold",
    color: colors.primary,
  },
  body: {
    flex: 1,
    backgroundColor: "#eee",
  },
  pdf: {
    flex: 1,
    backgroundColor: "#eee",
  },
  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    textAlign: "center",
    color: "#4B5563",
    fontSize: RFPercentage(2),
    marginTop: 12,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: RFPercentage(2),
  },
  pageBadge: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(11, 31, 68, 0.85)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pageText: {
    color: "#fff",
    fontSize: RFPercentage(1.7),
    fontWeight: "600",
  },
});
