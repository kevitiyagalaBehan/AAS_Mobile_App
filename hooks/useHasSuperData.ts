import { useEffect, useState } from "react";
import { useAuth } from "../src/context/AuthContext";
import { fetchSuperData, hasSuperData } from "../src/utils/superData";

// Whether the current account has any super/pension members, used to show or
// hide the Super tab. False until the check completes.
export function useHasSuperData() {
  const { userData } = useAuth();
  const [hasSuper, setHasSuper] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!userData?.authToken || !userData?.accountId) {
        setHasSuper(false);
        return;
      }
      const data = await fetchSuperData(userData.authToken, userData.accountId);
      if (!cancelled) setHasSuper(hasSuperData(data));
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [userData?.authToken, userData?.accountId]);

  return hasSuper;
}
