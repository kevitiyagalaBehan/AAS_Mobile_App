import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

export default function UpdateModal({
  visible,
  updateUrl,
}: {
  visible: boolean;
  updateUrl: string;
}) {
  const goToStore = () => Linking.openURL(updateUrl);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Update Available!</Text>
          <Text style={styles.message}>
            A new version of this app is available. Please update to continue
            using the app.
          </Text>
          <TouchableOpacity style={styles.button} onPress={goToStore}>
            <Text style={styles.buttonText}>Update Now!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      width: width * 0.85,
      backgroundColor: "white",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: RFPercentage(2.5),
      fontWeight: "bold",
      marginBottom: height * 0.02,
    },
    message: {
      textAlign: "center",
      marginBottom: height * 0.02,
      fontSize: RFPercentage(2),
    },
    button: {
      marginTop: height * 0.02,
      backgroundColor: "#00205A",
      padding: width * 0.03,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonText: {
      fontSize: RFPercentage(2),
      color: "white",
      fontWeight: "bold",
    },
  });
