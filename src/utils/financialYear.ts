import { AdviserFinancialYear } from "../navigation/types";

// Australian financial years run 1 July to 30 June and are named by the year they end:
// FY27 is 1 July 2026 to 30 June 2027.
export const currentFinancialYearEnd = (today = new Date()) =>
  today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear();

// The year a server financial year ends in, from its id (2027) or its label
// ("FY27", "FY2027", "2026/27", "2026-2027"). null if neither says.
export const financialYearEnd = (fy: AdviserFinancialYear): number | null => {
  if (fy.id >= 2000 && fy.id <= 2100) return fy.id;

  const label = fy.label ?? "";
  const range = label.match(/(\d{4})\s*[/-]\s*(\d{2,4})/);
  if (range) {
    const end = Number(range[2]);
    return end < 100 ? 2000 + end : end;
  }
  const fullYear = label.match(/(\d{4})/);
  if (fullYear) return Number(fullYear[1]);
  const shortYear = label.match(/FY\s*(\d{2})\b/i);
  if (shortYear) return 2000 + Number(shortYear[1]);
  return null;
};

// The previous and the current financial year, oldest first. If the server's years
// can't be read, all of them are shown rather than none.
export const recentFinancialYears = (
  years: AdviserFinancialYear[],
  today = new Date()
): AdviserFinancialYear[] => {
  const current = currentFinancialYearEnd(today);
  const recent = years
    .filter((fy) => {
      const end = financialYearEnd(fy);
      return end === current || end === current - 1;
    })
    .sort((a, b) => (financialYearEnd(a) ?? 0) - (financialYearEnd(b) ?? 0));
  return recent.length > 0 ? recent : years;
};

export const findCurrentFinancialYear = (
  years: AdviserFinancialYear[],
  today = new Date()
) => {
  const current = currentFinancialYearEnd(today);
  return years.find((fy) => financialYearEnd(fy) === current) ?? null;
};
