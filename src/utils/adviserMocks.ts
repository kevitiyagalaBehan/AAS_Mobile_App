// Dummy adviser data for endpoints the backend hasn't built yet (see ADVISER_MOCKS in devFlags.ts).
import {
  AdviserAccountList,
  AdviserBadgeCounts,
  AdviserRecentAccount,
} from "../navigation/types";
import badgeCounts from "../../docs/adviser-mocks/BadgeCounts.json";
import accounts from "../../docs/adviser-mocks/Accounts.json";
import recentlyViewed from "../../docs/adviser-mocks/RecentlyViewed.json";

export const mockBadgeCounts: AdviserBadgeCounts = badgeCounts;

const allAccounts = accounts as AdviserAccountList;

// Does what the server will do with search, filter and paging
export const mockAccounts = (
  search: string,
  filter: string,
  page: number,
  pageSize: number
): AdviserAccountList => {
  const text = search.trim().toLowerCase();
  const matches = allAccounts.items.filter(
    (a) =>
      (filter === "all" || a.accountType.toLowerCase() === filter) &&
      (!text ||
        a.accountName.toLowerCase().includes(text) ||
        (a.clientNames ?? "").toLowerCase().includes(text))
  );
  return {
    ...allAccounts,
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: matches.length,
  };
};

// Kept in memory so opening an account moves it to the front, like the server will
let recent: AdviserRecentAccount[] = recentlyViewed;

export const mockRecentlyViewed = (limit: number) => recent.slice(0, limit);

export const mockMarkViewed = (accountId: string) => {
  const account = allAccounts.items.find((a) => a.accountId === accountId);
  if (!account) return;
  recent = [
    {
      accountId,
      accountName: account.accountName,
      accountType: account.accountType,
      clientNames: account.clientNames,
      balance: account.balance,
      viewedAt: new Date().toISOString(),
    },
    ...recent.filter((r) => r.accountId !== accountId),
  ];
};
