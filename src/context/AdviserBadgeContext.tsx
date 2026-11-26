import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "./AuthContext";
import { getAdviserBadgeCounts } from "../utils/adviserApi";
import { AdviserBadgeCounts } from "../navigation/types";

const EMPTY: AdviserBadgeCounts = {
  unreadNotifications: 0,
  unansweredQueries: 0,
  unreadInbox: 0,
};

type AdviserBadgeContextType = {
  counts: AdviserBadgeCounts;
  refreshCounts: () => Promise<void>;
};

const AdviserBadgeContext = createContext<AdviserBadgeContextType>({
  counts: EMPTY,
  refreshCounts: async () => {},
});

// Counts for the bell dot and the Queries/Inbox tab badges. Loaded when the adviser
// layout opens, when the app comes back to the foreground, and on pull-to-refresh.
export const AdviserBadgeProvider = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  const [counts, setCounts] = useState<AdviserBadgeCounts>(EMPTY);

  const refreshCounts = useCallback(async () => {
    if (!userData?.authToken) return;
    const result = await getAdviserBadgeCounts(userData.authToken);
    if (result) setCounts(result);
  }, [userData?.authToken]);

  useEffect(() => {
    refreshCounts();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshCounts();
    });
    return () => subscription.remove();
  }, [refreshCounts]);

  return (
    <AdviserBadgeContext.Provider value={{ counts, refreshCounts }}>
      {children}
    </AdviserBadgeContext.Provider>
  );
};

export const useAdviserBadges = () => useContext(AdviserBadgeContext);
