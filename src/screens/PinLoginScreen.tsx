import React, { useEffect, useState } from "react";
import {
  Text,
  Image,
  Alert,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFPercentage } from "react-native-responsive-fontsize";
import PinPad from "../../components/PinPad";
import { useSession } from "../../hooks/useSession";
import { loginWithPin } from "../utils/pimsApi";
import {
  clearPinRegistration,
  getPinRegistration,
  updateDeviceToken,
  PIN_LENGTH,
  PinRegistration,
} from "../utils/pinStorage";
import { RootStackParamList } from "../navigation/types";

export default function PinLoginScreen() {
  const { startSession, enterApp } = useSession();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "PinLogin">>();
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  const [registration, setRegistration] = useState<PinRegistration | null>(null);
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    getPinRegistration().then((reg) => {
      if (!reg) {
        navigation.replace("Login");
        return;
      }
      setRegistration(reg);
    });
  }, []);

  const goToPasswordLogin = () => navigation.replace("Login");

  const submit = async (enteredPin: string) => {
    if (!registration) return;

    setLoading(true);
    try {
      const result = await loginWithPin(
        registration.deviceId,
        registration.deviceToken,
        enteredPin
      );

      switch (result.status) {
        case "success":
          if (result.newDeviceToken) {
            await updateDeviceToken(result.newDeviceToken);
          }
          await startSession(result.login);
          enterApp(result.login.accountType);
          return;

        case "invalid":
          setPin("");
          setError(
            result.remainingAttempts !== null
              ? `Incorrect PIN. ${result.remainingAttempts} attempt${
                  result.remainingAttempts === 1 ? "" : "s"
                } left.`
              : result.message
          );
          return;

        case "disabled":
          await clearPinRegistration();
          Alert.alert("PIN login disabled", result.message, [
            { text: "OK", onPress: goToPasswordLogin },
          ]);
          return;

        case "error":
          setPin("");
          setError(result.message);
          return;
      }
    } catch (err) {
      console.error("PIN login failed:", err);
      setPin("");
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setPin(value);
    if (error) setError("");
    if (value.length === PIN_LENGTH) submit(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../assets/aas_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        {registration?.displayName
          ? `Welcome back, ${registration.displayName}`
          : "Welcome back"}
      </Text>
      <Text style={styles.subtitle}>Enter your PIN to log in</Text>

      <Text style={styles.errorText}>{error}</Text>

      <PinPad
        length={PIN_LENGTH}
        value={pin}
        onChange={handleChange}
        disabled={!registration}
        loading={loading}
        error={!!error}
      />

      <TouchableOpacity
        onPress={goToPasswordLogin}
        disabled={loading}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>
          Forgot PIN? Log in with password
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
      width: width * 0.5,
      height: height * 0.12,
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
