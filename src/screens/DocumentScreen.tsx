import React from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Document, HeaderWithMenu } from "../../components";

export default function DocumentScreen() {
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <HeaderWithMenu />
          <View style={styles.bodySection}>
            <Document />
          </View>
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  
  const getStyles = (width: number) =>
    StyleSheet.create({
      container: {
        flex: 1,
      },
      bodySection: {
        paddingHorizontal: width * 0.02,
      },
    });
