import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import UserAvatar from "./UserAvatar";
import {
  getSuperFundName,
  getLinkedUsers,
  getEntityAccounts,
  getAssetAllocationSummaryOther,
  getAssetAllocationSummaryFamily,
} from "../src/utils/pimsApi";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, AccountOption } from "../src/navigation/types";

type HeaderProps = {
  refreshTrigger?: number;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Header({ refreshTrigger }: HeaderProps) {
  const [userAccountType, setUserAccountType] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const {
    userData,
    setUserData,
    currentAccountName,
    setCurrentAccountName,
    entityAccounts,
    setEntityAccounts,
  } = useAuth();
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setCurrentAccountName(null);
        setEntityAccounts([]);
        setAccountOptions([]);
        return;
      }

      const accountDetails = await getSuperFundName(
        userData.authToken,
        userData.accountId
      );

      const accountInfo = await getLinkedUsers(userData.authToken);
      setUserAccountType(accountInfo?.assignedAccountType || null);
      setUserFullName(accountInfo?.fullName || null);
      setUserFirstName(accountInfo?.fullName?.trim().split(" ")[0] || null);

      if (accountDetails && accountDetails.length > 0) {
        setCurrentAccountName(accountDetails[0].superFundName);
      } else {
        setCurrentAccountName("User not found");
      }

      if (entityAccounts.length === 0) {
        const parentEntity = {
          id: userData.accountId,
          accountName: currentAccountName || "Demo Family Group",
          accountType: userData.accountType,
          activePortfolio: "Yes",
        };

        const entities = await getEntityAccounts(
          userData.authToken,
          userData.accountId,
          parentEntity
        );
        setEntityAccounts(entities);
      }
    };

    fetchUserData();
  }, [userData?.authToken, userData?.accountId]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!userData?.authToken || !userData?.accountId) return;

      if (userData.accountType === "Family Group") {
        const summary = await getAssetAllocationSummaryFamily(
          userData.authToken,
          userData.accountId
        );
        setTotalBalance(
          summary
            ? summary.reduce((sum, item) => sum + item.marketValue, 0)
            : null
        );
        return;
      }

      const summary = await getAssetAllocationSummaryOther(
        userData.authToken,
        userData.accountId
      );
      setTotalBalance(summary ? summary.totalMarketValue : null);
    };

    fetchBalance();
  }, [
    userData?.authToken,
    userData?.accountId,
    userData?.accountType,
    refreshTrigger,
  ]);

  useEffect(() => {
    if (!userData?.accountId || !currentAccountName || !userData.accountType)
      return;

    const initialAccount: AccountOption = {
      key: userData.accountId,
      value: `${currentAccountName} - ${userData.accountType}`,
      accountType: userData.accountType,
    };

    const formattedEntities: AccountOption[] = entityAccounts.map((acc) => ({
      key: acc.id,
      value: `${acc.accountName} - ${acc.accountType}`,
      accountType: acc.accountType,
    }));

    const combined = [
      initialAccount,
      ...formattedEntities.filter((e) => e.key !== userData.accountId),
    ];

    setAccountOptions(combined);
  }, [
    entityAccounts,
    currentAccountName,
    userData?.accountId,
    userData?.accountType,
  ]);

  const handleAccountChange = (accountId: string) => {
    setPickerVisible(false);
    if (accountId === userData?.accountId) return;

    const selectedItem = accountOptions.find((item) => item.key === accountId);
    if (!selectedItem) return;

    const { accountType } = selectedItem;

    setUserData((prev) =>
      prev
        ? {
            ...prev,
            accountId,
            accountType,
          }
        : null
    );

    navigation.reset({
      index: 0,
      routes: [{ name: accountType === "Family Group" ? "Family" : "Other" }],
    });
  };

  if (!userData?.authToken || !userData?.accountId) return null;

  const canSwitchAccount = userAccountType === "Family Group";

  return (
    <View style={styles.headerSection}>
      <View style={styles.greetingRow}>
        <Text style={styles.greetingText} numberOfLines={1}>
          {getGreeting()}
          {userFirstName ? `, ${userFirstName}` : ""}
        </Text>
        <UserAvatar name={userFullName} />
      </View>

      <View style={styles.balanceCard}>
        <TouchableOpacity
          style={styles.accountRow}
          onPress={() => setPickerVisible(true)}
          disabled={!canSwitchAccount}
          activeOpacity={0.6}
        >
          <Text style={styles.accountNameText} numberOfLines={1}>
            {currentAccountName || "Loading account..."}
          </Text>
          {canSwitchAccount && (
            <Ionicons
              name="chevron-down"
              size={RFPercentage(2.4)}
              color="#fff"
              style={styles.chevron}
            />
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <Text style={styles.balanceLabel}>Total balance</Text>
        <Text style={styles.balanceValue} adjustsFontSizeToFit numberOfLines={1}>
          {totalBalance !== null ? formatCurrency(totalBalance) : "—"}
        </Text>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select account</Text>
            <ScrollView>
              {accountOptions.map((option) => {
                const isSelected = option.key === userData.accountId;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.dropdownItem}
                    onPress={() => handleAccountChange(option.key)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                    >
                      {option.value}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#1B77BE" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    headerSection: {
      backgroundColor: "#eee",
      paddingHorizontal: width * 0.02,
      paddingTop: height * 0.02,
      paddingBottom: height * 0.005,
    },
    greetingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: height * 0.015,
    },
    greetingText: {
      flex: 1,
      fontSize: RFPercentage(2),
      color: "#5A6478",
      marginRight: width * 0.03,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    accountNameText: {
      flexShrink: 1,
      fontSize: RFPercentage(2.4),
      fontWeight: "bold",
      color: "#fff",
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      marginVertical: height * 0.015,
    },
    chevron: {
      marginLeft: 6,
    },
    balanceCard: {
      backgroundColor: "#0B1F44",
      borderRadius: 18,
      paddingHorizontal: width * 0.05,
      paddingVertical: height * 0.02,
    },
    balanceLabel: {
      fontSize: RFPercentage(2),
      color: "#C9D3E6",
    },
    balanceValue: {
      fontSize: RFPercentage(4.6),
      fontWeight: "bold",
      color: "#fff",
      marginTop: 2,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "center",
      paddingHorizontal: width * 0.06,
    },
    modalSheet: {
      backgroundColor: "#fff",
      borderRadius: 12,
      paddingVertical: 12,
      maxHeight: height * 0.6,
    },
    modalTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: "bold",
      color: "#0B1F44",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: "#eee",
    },
    dropdownItemText: {
      flexShrink: 1,
      fontSize: RFPercentage(2),
      color: "#333",
    },
    dropdownItemSelected: {
      color: "#1B77BE",
      fontWeight: "bold",
    },
  });
