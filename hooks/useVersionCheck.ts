import { useEffect, useState } from "react";
import * as Application from "expo-application";

const compareVersions = (v1: string, v2: string): number => {
  const a = v1.split(".").map(Number);
  const b = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

export const useVersionCheck = () => {
  const [forceBlock, setForceBlock] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/kevitiyagalaBehan/AAS_Mobile_App/refs/heads/main/version.json"
        );
        const data = await response.json();

        const current = Application.nativeApplicationVersion ?? "0.0.0";

        //console.log("Detected app version:", current);
        //console.log("Minimum required version:", data.minimum_supported_version);

        if (compareVersions(current, data.minimum_supported_version) < 0) {
          setForceBlock(true);
          setUpdateUrl(data.update_url);
        }
      } catch (e) {
        console.warn("Version check failed", e);
      }
    };

    check();
  }, []);

  return { forceBlock, updateUrl };
};
