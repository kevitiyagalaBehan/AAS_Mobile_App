import { useEffect, useState } from "react";
import { getFinancialYears } from "../src/utils/pimsApi";
import { FinancialYear } from "../src/navigation/types";

// Financial years for a year dropdown, newest first. Selects the current year
// by default and keeps the user's choice across refreshes while it still exists.
export function useFinancialYears(authToken: string | undefined, refreshTrigger: number) {
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [yearId, setYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await getFinancialYears(authToken);
      if (cancelled) return;
      const sorted = [...(data ?? [])].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setYears(sorted);
      setYearId((current) =>
        sorted.some((y) => y.id === current)
          ? current
          : (sorted.find((y) => y.isCurrent) ?? sorted[0])?.id ?? null
      );
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken, refreshTrigger]);

  return {
    years,
    yearId,
    setYearId,
    selectedYear: years.find((y) => y.id === yearId),
    loading,
  };
}
