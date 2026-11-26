import React, { createContext, useState, useContext } from "react";
import {
  LoginResponse,
  AuthContextType,
  AuthProviderProps,
  AccountEntity,
  LinkedUsers,
  PendingNavigation,
  ViewingClient,
} from "../navigation/types";

const AuthContext = createContext<AuthContextType>({
  userData: null,
  setUserData: () => console.warn("setUserData called without AuthProvider"),
  currentUserName: null,
  setCurrentUserName: () =>
    console.warn("setCurrentUserName called without AuthProvider"),
  currentAccountName: null,
  setCurrentAccountName: () =>
    console.warn("setCurrentAccountName called without AuthProvider"),
  entityAccounts: [],
  setEntityAccounts: () =>
    console.warn("setEntityAccounts called without AuthProvider"),
  resetAuthState: () =>
    console.warn("resetAuthState called without AuthProvider"),
  loggedInUser: null,
  setLoggedInUser: () =>
    console.warn("setLoggedInUser called without AuthProvider"),
  pendingNavigation: null,
  setPendingNavigation: () =>
    console.warn("setPendingNavigation called without AuthProvider"),
  viewingClient: null,
  setViewingClient: () =>
    console.warn("setViewingClient called without AuthProvider"),
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LinkedUsers | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentAccountName, setCurrentAccountName] = useState<string | null>(
    null
  );
  const [entityAccounts, setEntityAccounts] = useState<AccountEntity[]>([]);
  const [viewingClient, setViewingClient] = useState<ViewingClient | null>(null);
  const resetAuthState = () => {
    setUserData(null);
    setViewingClient(null);
    setLoggedInUser(null);
    setCurrentUserName(null);
    setCurrentAccountName(null);
    setEntityAccounts([]);
    setPendingNavigation(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userData,
        setUserData,
        currentUserName,
        setCurrentUserName,
        currentAccountName,
        setCurrentAccountName,
        entityAccounts,
        setEntityAccounts,
        resetAuthState,
        loggedInUser,
        setLoggedInUser,
        pendingNavigation,
        setPendingNavigation,
        viewingClient,
        setViewingClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
