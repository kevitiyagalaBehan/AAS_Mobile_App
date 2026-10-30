import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import {
  loadThreadSummaries,
  onThreadSeen,
  ThreadSummary,
} from "../src/utils/messageThreads";

// Message threads for the Home screen. Reloaded when the screen comes back into
// focus, on pull-to-refresh, and whenever a thread is marked as read.
export const useMessageThreads = (refreshTrigger?: number) => {
  const { userData, loggedInUser } = useAuth();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);

  const reload = useCallback(async () => {
    if (!userData?.authToken || !userData?.accountId) return;
    try {
      setThreads(
        await loadThreadSummaries(
          userData.authToken,
          userData.accountId,
          loggedInUser?.fullName
        )
      );
    } catch {
      // Keep showing what we had
    }
  }, [userData?.authToken, userData?.accountId, loggedInUser?.fullName]);

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, refreshTrigger])
  );

  useEffect(() => onThreadSeen(reload), [reload]);

  return { threads, reload };
};
