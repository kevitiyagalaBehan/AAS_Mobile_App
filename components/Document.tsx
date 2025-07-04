import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  Linking,
  FlatList,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import {
  getAASDocuments,
  getFolderPath,
  getDocumentViewUrl,
  getAASDocumentRoot,
} from "../src/utils/pimsApi";
import { Documents, Folders } from "../src/navigation/types";
import { Base64 } from "js-base64";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRefreshTrigger } from "../hooks/useRefreshTrigger";

export default function Document() {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [rootPath, setRootPath] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");
  const [folders, setFolders] = useState<Folders[]>([]);
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Documents[] | null>(null);
  const [selectedTab, setSelectedTab] = useState<"aasFolders" | "aasDocuments">(
    "aasFolders"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Documents | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const updateFolderAndDocuments = async (path: string) => {
    setCurrentPath(path);
    fetchFolders(path);
  };

  const fetchFolders = async (path: string) => {
    if (!userData?.authToken) return;

    setLoading(true);
    try {
      const folderData = await getFolderPath(path, userData.authToken);
      setFolders(folderData || []);
    } catch (err) {
      setError("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!userData?.authToken || !currentPath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getAASDocuments(currentPath, userData.authToken);
      setDocuments(data?.slice(0, 20) || []);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const { refreshTrigger, refreshing, onRefresh } =
    useRefreshTrigger(fetchDocuments);

  useEffect(() => {
    const initFolders = async () => {
      if (!userData?.authToken || !userData?.accountId) return;
      const root = await getAASDocumentRoot(
        userData.accountId,
        userData.authToken
      );
      if (root) {
        setRootPath(root);
        setFolderStack([]);
        updateFolderAndDocuments(root);
      }
    };

    if (userData?.authToken && userData?.accountId) {
      initFolders();
    }
  }, [userData]);

  useEffect(() => {
    if (currentPath) {
      fetchDocuments();
    }
  }, [currentPath, userData?.authToken, refreshTrigger]);

  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  const handleCodePress = (item: Documents) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleFolderClick = async (item: Folders) => {
    if (!userData?.authToken) {
      Alert.alert("Error", "User is not authenticated.");
      return;
    }

    if (item.type === "FOLDER") {
      const newPath = `${currentPath}/${item.name}`;
      setFolderStack((prev) => [...prev, item.name]);
      updateFolderAndDocuments(newPath);
    } else if (item.type === "FILE") {
      try {
        const filePath = `${currentPath}/${item.name}`;
        const encodedPath = Base64.encode(filePath);
        const docUrl = await getDocumentViewUrl(
          encodedPath,
          userData.authToken
        );

        if (docUrl) {
          Linking.openURL(docUrl);
        } else {
          Alert.alert("Error", "Unable to retrieve document URL.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to open the document.");
      }
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const newStack = folderStack.slice(0, index + 1);
    const newPath = `${rootPath}/${newStack.join("/")}`;
    setFolderStack(newStack);
    updateFolderAndDocuments(newPath);
  };

  const renderBreadcrumbs = () => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: height * 0.01,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setFolderStack([]);
          updateFolderAndDocuments(rootPath);
        }}
      >
        <Text style={{ color: "#1B77BE", fontSize: RFPercentage(2) }}>
          Home
        </Text>
      </TouchableOpacity>
      {folderStack.map((folder, idx) => (
        <Text key={idx}>
          {" > "}
          <Text
            style={{
              color: "#1B77BE",
              textDecorationLine: "underline",
              fontSize: RFPercentage(2),
            }}
            onPress={() => handleBreadcrumbClick(idx)}
          >
            {folder}
          </Text>
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "aasFolders" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("aasFolders")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "aasFolders" && styles.activeTabText,
              ]}
            >
              AAS Folders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "aasDocuments" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("aasDocuments")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "aasDocuments" && styles.activeTabText,
              ]}
            >
              AAS Documents
            </Text>
          </TouchableOpacity>
        </View>
        {selectedTab === "aasFolders" && (
          <View>
            {renderBreadcrumbs()}
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 1 }]}>Name</Text>
                <Text
                  style={[styles.headerCell, { flex: 1, textAlign: "center" }]}
                >
                  Modified Date
                </Text>
              </View>
              <FlatList
                data={folders || []}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                renderItem={({ item, index }) => {
                  let iconName = "folder";
                  let iconColor = "#FFD700";

                  if (item.type !== "FOLDER") {
                    switch (item.fileType?.toLowerCase()) {
                      case "pdf":
                        iconName = "picture-as-pdf";
                        iconColor = "#D32F2F";
                        break;
                      case "doc":
                      case "docx":
                        iconName = "description";
                        iconColor = "#2A5699";
                        break;
                      case "xls":
                      case "xlsx":
                        iconName = "grid-on";
                        iconColor = "#1B8836";
                        break;
                      default:
                        iconName = "insert-drive-file";
                        iconColor = "#757575";
                        break;
                    }
                  }

                  return (
                    <TouchableOpacity
                      style={[
                        styles.dataRow,
                        { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
                      ]}
                      onPress={() => handleFolderClick(item)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <MaterialIcons
                          name={iconName}
                          size={20}
                          color={iconColor}
                          style={{ marginRight: width * 0.02 }}
                        />
                        <Text style={[styles.dataCell, styles.leftAlign]}>
                          {item.name}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.dataCell,
                          { flex: 1, textAlign: "center" },
                        ]}
                      >
                        {item.lastModifiedDate
                          ? new Date(item.lastModifiedDate).toLocaleDateString(
                              "en-AU",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={() => (
                  <Text style={styles.noData}>No data</Text>
                )}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={(_, contentHeight) => {
                  setIsScrollable(contentHeight > height);
                }}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingBottom: isScrollable ? height * 0.8 : 0,
                }}
              />
            </View>
          </View>
        )}

        {selectedTab === "aasDocuments" && (
          <View>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 3.5 }]}>Name</Text>
                <Text
                  style={[styles.headerCell, { flex: 1, textAlign: "center" }]}
                >
                  Action
                </Text>
              </View>

              <FlatList
                data={documents}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                  let iconName = "insert-drive-file";
                  let iconColor = "#757575";

                  const ext = item.extension?.toLowerCase();
                  if (ext === ".pdf") {
                    iconName = "picture-as-pdf";
                    iconColor = "#D32F2F";
                  } else if (ext === ".doc" || ext === ".docx") {
                    iconName = "description";
                    iconColor = "#2A5699";
                  } else if (ext === ".xls" || ext === ".xlsx") {
                    iconName = "grid-on";
                    iconColor = "#1B8836";
                  }

                  return (
                    <View
                      style={[
                        styles.dataRow,
                        { backgroundColor: index % 2 === 0 ? "#eee" : "#fff" },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleCodePress(item)}
                        style={{ flex: 3.5 }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            flex: 1,
                          }}
                        >
                          <MaterialIcons
                            name={iconName}
                            size={20}
                            color={iconColor}
                            style={{ marginRight: width * 0.02 }}
                          />
                          <Text
                            style={[
                              styles.dataCell,
                              styles.leftAlign,
                              styles.underlineText,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <TouchableOpacity
                          style={styles.button}
                          onPress={async () => {
                            try {
                              if (!userData?.authToken) {
                                Alert.alert(
                                  "Error",
                                  "User is not authenticated."
                                );
                                return;
                              }

                              const encodedPath = Base64.encode(item.fullPath);
                              const docUrl = await getDocumentViewUrl(
                                encodedPath,
                                userData.authToken
                              );

                              if (docUrl) {
                                Linking.openURL(docUrl);
                              } else {
                                Alert.alert(
                                  "Error",
                                  "Unable to retrieve document URL."
                                );
                              }
                            } catch (error) {
                              Alert.alert(
                                "Error",
                                "Failed to open the document."
                              );
                            }
                          }}
                        >
                          <Text style={styles.buttonText}>Open</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                onContentSizeChange={(_, contentHeight) => {
                  setIsScrollable(contentHeight > height);
                }}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingBottom: isScrollable ? height * 0.54 : 0,
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <Text style={styles.noData}>No data</Text>
                )}
              />
            </View>

            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  {selectedItem && (
                    <>
                      <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Modified Date:</Text>
                        <Text style={styles.modalText}>
                          {new Date(
                            selectedItem.lastModified
                          ).toLocaleDateString("en-AU", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Folder:</Text>
                        <Text style={styles.modalText}>
                          {selectedItem.folder}
                        </Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Size:</Text>
                        <Text style={styles.modalText}>
                          {selectedItem.sizeText}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </Modal>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      marginTop: height * 0.02,
      backgroundColor: "#fff",
      borderRadius: 6,
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      padding: width * 0.02,
    },
    tabContainer: {
      flexDirection: "row",
    },
    tab: {
      flex: 1,
      padding: 12,
      backgroundColor: "#fff",
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: "#1B77BE",
    },
    tabText: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      color: "#1B77BE",
    },
    activeTabText: {
      color: "#fff",
    },
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.6),
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      textAlign: "center",
      marginTop: height * 0.3,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      //marginBottom: height * 0.001,
    },
    headerCell: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
      textAlign: "left",
    },
    dataRow: {
      flexDirection: "row",
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.02,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ccc",
    },
    dataCell: {
      fontSize: RFPercentage(2),
      color: "#333",
    },
    underlineText: {
      textDecorationLine: "underline",
      color: "#1B77BE",
    },
    leftAlign: {
      textAlign: "left",
    },
    centerAlign: {
      textAlign: "center",
    },
    rightAlign: {
      textAlign: "right",
    },
    button: {
      backgroundColor: "#1B77BE",
      paddingVertical: height * 0.007,
      paddingHorizontal: width * 0.04,
      borderRadius: 6,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
    noData: {
      textAlign: "center",
      marginVertical: height * 0.01,
      color: "#888",
      fontSize: RFPercentage(2),
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      width: width * 0.8,
      backgroundColor: "white",
      borderRadius: 10,
      padding: width * 0.05,
    },
    modalTitle: {
      fontSize: RFPercentage(2.5),
      fontWeight: "bold",
      color: "#4A90E2",
      marginBottom: height * 0.02,
      textAlign: "center",
    },
    modalRow: {
      flexDirection: "row",
      marginBottom: height * 0.015,
    },
    modalLabel: {
      fontWeight: "bold",
      width: width * 0.3,
      fontSize: RFPercentage(2),
    },
    modalText: {
      flex: 1,
      fontSize: RFPercentage(2),
    },
    closeButton: {
      marginTop: height * 0.02,
      backgroundColor: "#00205A",
      padding: width * 0.03,
      borderRadius: 10,
      alignItems: "center",
    },
    closeButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
  });
