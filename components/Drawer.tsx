import { StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import React from "react";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Drawer() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{
          paddingTop: height * 0.02,
        }}
      >
        <Ionicons name="menu" size={30} color="#1B77BE" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
  },
});
