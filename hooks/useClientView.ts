import { useCallback } from "react";
import { useAuth } from "../src/context/AuthContext";
import { navigationRef } from "../src/navigation/RootNavigation";
import { ViewingClient } from "../src/navigation/types";
import { clientRoute } from "../src/utils/userRoute";

// Lets an adviser open a client's account in the client layout and come back.
// Every client screen reads the account from userData, so opening a client points
// userData at that account. The adviser's token and role don't change.
export function useClientView() {
  const {
    viewingClient,
    setViewingClient,
    setUserData,
    setCurrentAccountName,
    setEntityAccounts,
  } = useAuth();

  const openClient = useCallback(
    (client: ViewingClient) => {
      setViewingClient(client);
      setUserData((prev) =>
        prev
          ? { ...prev, accountId: client.accountId, accountType: client.accountType }
          : prev
      );
      // Shown straight away; the header replaces it with the server's name once loaded
      setCurrentAccountName(client.accountName);
      setEntityAccounts([]);
      // The adviser layout stays underneath, so back (or the home button) returns to it
      if (navigationRef.isReady()) navigationRef.navigate(clientRoute(client.accountType), {});
    },
    [setViewingClient, setUserData, setCurrentAccountName, setEntityAccounts]
  );

  const exitClient = useCallback(() => {
    if (navigationRef.isReady()) navigationRef.navigate("Adviser");
  }, []);

  // Runs when the adviser layout is back in view, however the adviser left the client
  // (home button, menu or the Android back button). It only uses state setters, so it
  // stays the same function and useFocusEffect runs it on focus, not when a client opens.
  const clearClient = useCallback(() => {
    setViewingClient(null);
    setUserData((prev) =>
      prev && (prev.accountId || prev.accountType)
        ? { ...prev, accountId: "", accountType: "" }
        : prev
    );
    setCurrentAccountName(null);
    setEntityAccounts((prev) => (prev.length ? [] : prev));
  }, [setViewingClient, setUserData, setCurrentAccountName, setEntityAccounts]);

  return { viewingClient, openClient, exitClient, clearClient };
}
