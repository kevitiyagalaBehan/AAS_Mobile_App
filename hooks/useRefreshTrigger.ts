import { useCallback, useState } from "react";

export function useRefreshTrigger(onRefreshCallback?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger(Date.now());
    try {
      await onRefreshCallback?.();
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshCallback]);

  return {
    refreshTrigger,
    refreshing,
    onRefresh,
    setRefreshing,
  };
}