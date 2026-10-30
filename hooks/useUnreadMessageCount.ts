import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import { loadThreadSummaries } from "../src/utils/messageThreads";

// Number of message threads with replies the user hasn't opened yet.
// Re-checked whenever the calling screen comes back into focus.
export const useUnreadMessageCount = (refreshTrigger?: number) => {
  const { userData, loggedInUser } = useAuth();
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!userData?.authToken || !userData?.accountId) return;

      loadThreadSummaries(
        userData.authToken,
        userData.accountId,
        loggedInUser?.fullName
      )
        .then((threads) => {
          if (!cancelled) setCount(threads.filter((t) => t.unread).length);
        })
        .catch(() => {});

      return () => {
        cancelled = true;
      };
    }, [
      userData?.authToken,
      userData?.accountId,
      loggedInUser?.fullName,
      refreshTrigger,
    ])
  );

  return count;
};
