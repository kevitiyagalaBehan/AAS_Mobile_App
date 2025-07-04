import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAuth } from "../src/context/AuthContext";
import {
  getSuperFundName,
  getLinkedUsers,
  getEntityAccounts,
} from "../src/utils/pimsApi";
import { SelectList } from "react-native-dropdown-select-list";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, AccountOption } from "../src/navigation/types";

export default function Header() {
  const [userAccountType, setUserAccountType] = useState<string | null>(null);
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

  return (
    <View style={styles.headerSection}>
      <Text style={styles.accountNameText}>
        {currentAccountName || "Loading user..."}
      </Text>
      {userAccountType === "Family Group" && (
        <SelectList
          setSelected={handleAccountChange}
          data={accountOptions}
          save="key"
          placeholder="Select account..."
          //boxStyles={styles.dropDownBox}
          //dropdownStyles={styles.dropDownList}
          dropdownItemStyles={styles.dropdownItem}
        />
      )}
    </View>
  );
}

const getStyles = (width: number, height: number) =>
  StyleSheet.create({
    headerSection: {
      backgroundColor: "#fff",
      paddingHorizontal: width * 0.04,
      paddingTop: height * 0.023,
      paddingBottom: height * 0.015,
    },
    accountNameText: {
      fontSize: RFPercentage(2.7),
      fontWeight: "bold",
      color: "#1B77BE",
      marginBottom: 10,
    },
    dropDownBox: {
      //backgroundColor: "#eee",
    },
    dropDownList: {
      //backgroundColor: "#eee",
    },
    dropdownItem: {
      paddingHorizontal: width * 0.06,
    },
  });
