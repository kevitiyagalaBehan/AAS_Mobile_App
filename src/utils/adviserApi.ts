// Adviser dashboard calls to the AdviserDashboard endpoints.
// Endpoints switched on in ADVISER_MOCKS (devFlags.ts) return dummy data instead.
import Constants from "expo-constants";
import {
  AdviserAccountList,
  AdviserBadgeCounts,
  AdviserInvestmentOverview,
  AdviserJobSummary,
  AdviserRecentAccount,
  JobPhase,
} from "../navigation/types";
import { ADVISER_MOCKS } from "./devFlags";
import {
  mockAccounts,
  mockBadgeCounts,
  mockMarkViewed,
  mockRecentlyViewed,
} from "./adviserMocks";

export type AccountQuery = {
  search?: string;
  // A key from AdviserAccountList.filters; "all" for no filter
  filter?: string;
  page?: number;
  pageSize?: number;
};

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string;

// Short delay so loading states show while using dummy data
const mock = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 400));

const getJson = async <T>(path: string, authToken: string): Promise<T | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) {
      console.error(`GET ${path} failed: ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`GET ${path} failed:`, error);
    return null;
  }
};

const PHASES: Record<string, JobPhase> = {
  notstarted: "notStarted",
  inprogress: "inProgress",
  lodged: "lodged",
};

// The server types phase as a plain string, so accept "NotStarted", "not_started" etc.
// A stage with an unknown phase isn't counted in any tile.
const normaliseJobSummary = (data: AdviserJobSummary): AdviserJobSummary => ({
  ...data,
  stages: data.stages.map((stage) => {
    const phase = PHASES[String(stage.phase).toLowerCase().replace(/[^a-z]/g, "")];
    if (!phase) console.warn(`Unknown job stage phase "${stage.phase}" for ${stage.code}`);
    return { ...stage, phase };
  }),
});

// Leave financialYearId out to get the year the server treats as current
export const getAdviserJobSummary = async (
  authToken: string,
  financialYearId: number | null
): Promise<AdviserJobSummary | null> => {
  const data = await getJson<AdviserJobSummary>(
    financialYearId == null
      ? "/AdviserDashboard/JobSummary"
      : `/AdviserDashboard/JobSummary/${financialYearId}`,
    authToken
  );
  return data ? normaliseJobSummary(data) : null;
};

export const getAdviserInvestmentOverview = (
  authToken: string
): Promise<AdviserInvestmentOverview | null> =>
  getJson("/AdviserDashboard/InvestmentOverview", authToken);

export const getAdviserAccounts = (
  authToken: string,
  { search = "", filter = "all", page = 1, pageSize = 50 }: AccountQuery
): Promise<AdviserAccountList | null> => {
  if (ADVISER_MOCKS.accounts) return mock(mockAccounts(search, filter, page, pageSize));
  const params = new URLSearchParams({
    filter,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search.trim()) params.set("search", search.trim());
  return getJson(`/AdviserAccounts?${params}`, authToken);
};

export const getAdviserRecentlyViewed = (
  authToken: string,
  limit = 10
): Promise<AdviserRecentAccount[] | null> =>
  ADVISER_MOCKS.recentlyViewed
    ? mock(mockRecentlyViewed(limit))
    : getJson(`/AdviserAccounts/RecentlyViewed?limit=${limit}`, authToken);

// Records that the adviser opened this account, for the Recently viewed list
export const markAccountViewed = async (authToken: string, accountId: string) => {
  if (ADVISER_MOCKS.recentlyViewed) {
    mockMarkViewed(accountId);
    return;
  }
  const path = `/AdviserAccounts/${encodeURIComponent(accountId)}/Viewed`;
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) console.error(`POST ${path} failed: ${response.status}`);
  } catch (error) {
    console.error(`POST ${path} failed:`, error);
  }
};

export const getAdviserBadgeCounts = (
  authToken: string
): Promise<AdviserBadgeCounts | null> =>
  ADVISER_MOCKS.badgeCounts
    ? mock(mockBadgeCounts)
    : getJson("/AdviserDashboard/BadgeCounts", authToken);
