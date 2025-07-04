import { useState, useEffect } from "react";
import { getAssetAllocationSummaryFamily } from "../src/utils/pimsApi";
import {
  AssetCategory,
  PortfolioData,
} from "../src/navigation/types";

export function usePortfolioSummary(
  authToken: string,
  accountId: string,
  refreshTrigger: number
) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken || !accountId) {
      setLoading(false);
      setError("Missing credentials");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAssetAllocationSummaryFamily(
          authToken,
          accountId
        );
        if (!response) {
          setError("No data received");
          setData(null);
          return;
        }

        const categoryMap: Record<string, AssetCategory> = {};
        let totalMarketValue = 0;

        response.forEach((item) => {
          const { assetCategory, assetClass, marketValue, marketPercentage } =
            item;
          totalMarketValue += marketValue;

          if (!categoryMap[assetCategory]) {
            categoryMap[assetCategory] = {
              assetCategory,
              marketValue: 0,
              percentage: 0,
              assetClasses: [],
            };
          }

          categoryMap[assetCategory].marketValue += marketValue;
          categoryMap[assetCategory].percentage += marketPercentage;
          categoryMap[assetCategory].assetClasses!.push({
            assetClass,
            marketValue,
            percentage: marketPercentage,
          });
        });

        const assetCategories: AssetCategory[] = Object.values(categoryMap);

        const totalPercentage = assetCategories.reduce(
          (sum, cat) =>
            sum + cat.assetClasses!.reduce((s, a) => s + a.percentage, 0),
          0
        );

        setData({
          assetCategories,
          totalMarketValue,
          totalPercentage,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch or process data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken, accountId, refreshTrigger]);

  return { data, loading, error };
}
