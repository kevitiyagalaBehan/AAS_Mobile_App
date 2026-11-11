import { Image } from "react-native";
import * as SecureStore from "expo-secure-store";
import { PracticeInfo } from "../navigation/types";

// Kept in SecureStore rather than AsyncStorage, because logout clears AsyncStorage and the
// login screens need the practice logo after logout.
const PRACTICE_KEY = "practice_info";

// Adds the logo version to the URL, so a replaced logo isn't served from the image cache.
export const getLogoUri = (practice: PracticeInfo | null): string | null => {
  if (!practice?.logoUrl) return null;
  if (!practice.logoVersion) return practice.logoUrl;

  const separator = practice.logoUrl.includes("?") ? "&" : "?";
  return `${practice.logoUrl}${separator}v=${encodeURIComponent(practice.logoVersion)}`;
};

export const getSavedPractice = async (): Promise<PracticeInfo | null> => {
  try {
    const value = await SecureStore.getItemAsync(PRACTICE_KEY);
    return value ? (JSON.parse(value) as PracticeInfo) : null;
  } catch (error) {
    console.warn("Failed to read saved practice:", error);
    return null;
  }
};

// Saves the practice from a login response. null (no practice) clears it, so the AAS logo shows.
export const savePractice = async (practice: PracticeInfo | null) => {
  try {
    if (!practice) {
      await SecureStore.deleteItemAsync(PRACTICE_KEY);
      return;
    }

    await SecureStore.setItemAsync(PRACTICE_KEY, JSON.stringify(practice));

    // Download the logo now, so the login screen can show it next time even when offline.
    const uri = getLogoUri(practice);
    if (uri) {
      Image.prefetch(uri).catch((error) =>
        console.warn("Failed to download practice logo:", error)
      );
    }
  } catch (error) {
    console.warn("Failed to save practice:", error);
  }
};
