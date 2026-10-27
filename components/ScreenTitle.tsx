import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";

type ScreenTitleProps = {
  title: string;
  showBack?: boolean;
};

export default function ScreenTitle({ title, showBack = false }: ScreenTitleProps) {
  const navigation = useNavigation<any>();
  const { currentAccountName } = useAuth();
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  // Back always lands on the Home tab, not whichever tab was last open
  const goHome = () =>
    navigation.navigate("MainTabs", { screen: "HomeOther" });

  return (
    <View style={styles.container}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={goHome}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Ionicons name="chevron-back" size={RFPercentage(3)} color="#0B1F44" />
        </TouchableOpacity>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {currentAccountName && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {currentAccountName}
          </Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: width * 0.03,
      paddingTop: height * 0.02,
      paddingBottom: height * 0.012,
    },
    backButton: {
      marginRight: width * 0.02,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: RFPercentage(3),
      fontWeight: "bold",
      color: "#0B1F44",
    },
    subtitle: {
      fontSize: RFPercentage(1.8),
      color: "#5A6478",
      marginTop: 2,
    },
  });
