import React, { createContext, useContext, useEffect, useState } from "react";
import { EsignDocument } from "../navigation/types";
import { getEsignDocuments } from "../utils/pimsApi";
import { useAuth } from "./AuthContext";

type ESignContextType = {
  toBeSignedCount: number;
  refreshESignData: () => void;
};

const ESignContext = createContext<ESignContextType>({
  toBeSignedCount: 0,
  refreshESignData: () => {},
});

export const useESign = () => useContext(ESignContext);

export const ESignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  const [documents, setDocuments] = useState<EsignDocument[]>([]);

  const fetchDocuments = async () => {
    if (!userData?.authToken || !userData?.accountId) return;

    try {
      const data = await getEsignDocuments(userData.authToken, userData.accountId);
      setDocuments(data || []);
    } catch (error) {
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userData?.authToken, userData?.accountId]);

  const toBeSignedCount = documents.filter((doc) =>
    doc.signatories.some((s) => s.esigningStatus !== "Signed")
  ).length;

  return (
    <ESignContext.Provider value={{ toBeSignedCount, refreshESignData: fetchDocuments }}>
      {children}
    </ESignContext.Provider>
  );
};
