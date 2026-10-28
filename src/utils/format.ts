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

// Home "Total balance" and Portfolio "Market value" both use this, so they always match
export const getHoldingsTotal = (investments: Investment[]) =>
  investments.reduce((sum, inv) => sum + inv.marketValue, 0);
