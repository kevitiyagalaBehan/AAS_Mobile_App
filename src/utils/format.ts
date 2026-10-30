import { Investment } from "../navigation/types";

export const formatCurrency = (value: number, decimals = 2) =>
  `$${value.toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export const formatShortDate = (value: string | number | Date) =>
  new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Local calendar date as YYYY-MM-DD. toISOString() would use UTC, which in
// Australia is still the previous day until mid-morning.
export const toApiDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// Home "Total balance" and Portfolio "Market value" both use this, so they always match
export const getHoldingsTotal = (investments: Investment[]) =>
  investments.reduce((sum, inv) => sum + inv.marketValue, 0);
