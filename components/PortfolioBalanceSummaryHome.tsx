import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import Svg, { Rect } from "react-native-svg";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import { getSuperFundDetails } from "../src/utils/pimsApi";
import { Props, PortfolioItem, SelectedData } from "../src/navigation/types";
import { useIsFocused } from "@react-navigation/native";

export default function PortfolioBalanceSummaryHome({ refreshTrigger }: Props) {
  const { userData } = useAuth();
  const { width, height } = useWindowDimensions();
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<SelectedData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused();

  const fetchData = async () => {
    if (!userData?.authToken || !userData?.accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getSuperFundDetails(
        userData.authToken,
        userData.accountId
      );

      if (data) {
        setPortfolioData(
          data.map((item) => ({
            year: item.year,
            value: item.clientTotal,
            dataDownDate: item.dataDownDate,
          }))
        );
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userData?.authToken, userData?.accountId, refreshTrigger]);

  useEffect(() => {
    if (isFocused) {
      setSelectedData(null);
    }
  }, [isFocused]);

  const chartWidth = width * 0.9;
  const chartHeight = height * 0.4;
  const styles = getStyles(width, height);

  if (loading) {
    return <Text style={styles.loader}>Loading...</Text>;
  }

  if (!userData || error) {
    return <Text style={styles.errorText}>Data Loading Error...</Text>;
  }

  if (!portfolioData || portfolioData.length === 0) {
    return <Text style={styles.errorText}>No portfolio data available</Text>;
  }

  const sortedData = [...portfolioData].sort((a, b) => a.year - b.year);
  const latestFiveData = sortedData.slice(-5);

  const handleBarPress = (item: PortfolioItem) => {
    setSelectedData({
      clientTotal: item.value,
      dataDownDate: item.dataDownDate,
      year: item.year,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const maxValue = Math.max(...latestFiveData.map((item) => item.value));

  const isMillion = maxValue >= 1_000_000;
  const divisor = isMillion ? 1_000_000 : 1_000;
  const suffix = isMillion ? "M" : "K";

  return (
    <View style={styles.container}>
      <View style={styles.border}>
        <Text style={styles.bodyText}>Portfolio Balance Summary</Text>

        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: latestFiveData.map((item) => `${item.year}`),
              datasets: [
                {
                  data: latestFiveData.map((item) => item.value / divisor),
                },
              ],
            }}
            width={chartWidth}
            height={chartHeight}
            yAxisLabel=""
            yAxisSuffix={suffix}
            chartConfig={{
              backgroundColor: "#f5f5f5",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 2,
              color: () => `rgba(195, 16, 231, 1)`,
              labelColor: () => `rgba(0, 0, 0, 1)`,
              barPercentage: 1,
              propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: "#e0e0e0",
                strokeDasharray: "5,5",
              },
              propsForLabels: {
                fontSize: RFPercentage(1.7),
              },
              formatYLabel: (yValue: string) => {
                const num = parseFloat(yValue);
                return num.toFixed(2);
              },
            }}
            fromZero
          />
          <Svg
            width={chartWidth}
            height={chartHeight}
            style={StyleSheet.absoluteFill}
          >
            {latestFiveData.map((item, index) => {
              const barWidth = chartWidth / latestFiveData.length - 20;
              const x = (chartWidth * index) / latestFiveData.length + 15;
              const y = chartHeight - (item.value / 1_000_000) * 200;

              return (
                <Rect
                  key={index}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={chartHeight - y}
                  fill="transparent"
                  onPress={() => handleBarPress(item)}
                />
              );
            })}
          </Svg>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedData && (
                <>
                  <Text style={styles.modalTitle}>
                    Year {selectedData.year}
                  </Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Client Total:</Text>
                    <Text style={styles.modalText}>
                      ${selectedData.clientTotal.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Down Date:</Text>
                    <Text style={styles.modalText}>
                      {new Date(selectedData.dataDownDate).toLocaleDateString(
                        "en-GB"
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: 6,
      marginTop: height * 0.01,
    },
    border: {
      borderWidth: 1,
      borderColor: "#1B77BE",
      borderRadius: 6,
      paddingHorizontal: width * 0.02,
    },
    loader: {
      fontWeight: "bold",
      color: "#1B77BE",
      fontSize: RFPercentage(2.6),
      marginTop: height * 0.021,
      marginLeft: height * 0.01,
    },
    chartContainer: {
      marginBottom: height * 0.01,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: height * 0.4,
    },
    bodyText: {
      //fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: height * 0.005,
      fontSize: RFPercentage(2.6),
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      minHeight: height * 0.8,
    },
    errorText: {
      color: "red",
      fontSize: RFPercentage(2),
      textAlign: "center",
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
      color: "#1B77BE",
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
      backgroundColor: "#1B77BE",
      padding: width * 0.03,
      borderRadius: 5,
      alignItems: "center",
    },
    closeButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: RFPercentage(2),
    },
  });
