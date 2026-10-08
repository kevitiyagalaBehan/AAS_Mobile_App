import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import PinPad from "../../components/PinPad";
import { useAuth } from "../context/AuthContext";
import { useSession } from "../../hooks/useSession";
import { registerPin } from "../utils/pimsApi";
import {
  getDeviceId,
  isWeakPin,
  savePinRegistration,
  PIN_LENGTH,
} from "../utils/pinStorage";
import { RootStackParamList } from "../navigation/types";

type Step = "create" | "confirm";

export default function PinSetupScreen() {
  const { userData, loggedInUser } = useAuth();
  const { enterApp } = useSession();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "PinSetup">>();
  const { mode } = useRoute<RouteProp<RootStackParamList, "PinSetup">>().params;
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const [step, setStep] = useState<Step>("create");
  const [firstPin, setFirstPin] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const finish = () => {
    if (mode === "afterLogin" && userData) {
      enterApp(userData.accountType);
    } else {
      navigation.goBack();
    }
  };

  const restart = (message: string) => {
    setError(message);
    setFirstPin("");
    setPin("");
    setStep("create");
  };

  const submit = async (confirmedPin: string) => {
    if (!userData?.authToken) {
      Alert.alert("Session expired", "Please log in again to set up a PIN.");
      finish();
      return;
    }

    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      const result = await registerPin(userData.authToken, deviceId, confirmedPin);

      if (!result.success) {
        restart(result.message);
        return;
      }

      await savePinRegistration(result.deviceToken, loggedInUser?.fullName ?? null);

      Alert.alert(
        "PIN set up",
        "Next time, you can log in with your PIN on this device.",
        [{ text: "OK", onPress: finish }]
      );
    } catch (err) {
      console.error("PIN setup failed:", err);
      restart("Unable to set up PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setPin(value);
    if (error) setError("");
    if (value.length < PIN_LENGTH) return;

    if (step === "create") {
      if (isWeakPin(value)) {
        restart("That PIN is too easy to guess. Please choose another.");
        return;
      }
      setFirstPin(value);
      setPin("");
      setStep("confirm");
      return;
    }

    if (value !== firstPin) {
      restart("PINs didn't match. Please try again.");
      return;
    }

    submit(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../assets/aas_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        {step === "create" ? "Create a 6-digit PIN" : "Confirm your PIN"}
      </Text>
      <Text style={styles.subtitle}>
        {step === "create"
          ? "Use this PIN to log in quickly on this device instead of your password."
          : "Enter the same PIN again."}
      </Text>

      <Text style={styles.errorText}>{error}</Text>

      <PinPad
        length={PIN_LENGTH}
        value={pin}
        onChange={handleChange}
        loading={loading}
        error={!!error}
      />

      <TouchableOpacity
        onPress={finish}
        disabled={loading}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>
          {mode === "afterLogin" ? "Not now" : "Cancel"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: 20,
    },
    logo: {
      width: width * 0.4,
      height: height * 0.1,
      marginBottom: height * 0.02,
    },
    title: {
      fontSize: RFPercentage(2.8),
      fontWeight: "bold",
      color: "#00205A",
      marginBottom: height * 0.01,
      textAlign: "center",
    },
    subtitle: {
      fontSize: RFPercentage(2),
      color: "#666",
      textAlign: "center",
      marginBottom: height * 0.01,
    },
    errorText: {
      minHeight: RFPercentage(5),
      color: "#ff4444",
      fontSize: RFPercentage(1.9),
      textAlign: "center",
      marginBottom: height * 0.01,
    },
    secondaryButton: {
      marginTop: height * 0.02,
      padding: 10,
    },
    secondaryText: {
      color: "#1B77BE",
      fontSize: RFPercentage(2),
      textDecorationLine: "underline",
    },
  });
