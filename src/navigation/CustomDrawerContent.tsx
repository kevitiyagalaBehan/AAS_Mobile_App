import React, { useEffect } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { handleLogout } from "../utils/logout";
import { getLinkedUsers } from "../utils/pimsApi";

export default function CustomDrawerContent(props: any) {
  const { userData, setCurrentUserName, currentUserName, resetAuthState } =
    useAuth();
  const { navigation } = props;
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userData?.authToken) {
          setCurrentUserName(null);
          return;
        }

        const userName = await getLinkedUsers(userData.authToken);
        setCurrentUserName(userName?.fullName || "User");
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setCurrentUserName("Error loading user");
      }
    };

    fetchUserData();
  }, [userData?.authToken]);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        <Image
          source={require("../../assets/aas_logo.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.userName}>
          Welcome, {currentUserName || "User"}
        </Text>
      </View>

      <DrawerItemList {...props} />

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => handleLogout(navigation, true, resetAuthState)}
      >
        <Ionicons name="log-out" size={30} color="red" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    headerContainer: {
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
    },
    image: {
      width: width * 1,
      height: height * 0.08,
    },
    userName: {
      fontSize: RFPercentage(2),
      fontWeight: "bold",
      marginTop: height * 0.01,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: "#ccc",
    },
    logoutText: {
      fontSize: RFPercentage(2),
      color: "red",
      fontWeight: "bold",
      marginLeft: width * 0.03,
    },
  });
