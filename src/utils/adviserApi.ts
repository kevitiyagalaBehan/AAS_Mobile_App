// Adviser dashboard calls to the AdviserDashboard endpoints.
// Endpoints switched on in ADVISER_MOCKS (devFlags.ts) return dummy data instead.
import Constants from "expo-constants";
import {
  AdviserAccountsSummary,
  AdviserBadgeCounts,
  AdviserInvestmentOverview,
  AdviserJobSummary,
  JobPhase,
} from "../navigation/types";
import { ADVISER_MOCKS } from "./devFlags";
import { mockBadgeCounts } from "./adviserMocks";

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

// Every account in the practice, with filter counts and each account's lastViewedAt
export const getAdviserAccounts = (
  authToken: string
): Promise<AdviserAccountsSummary | null> =>
  getJson("/AdviserDashboard/AccountsSummary", authToken);

// Records that the adviser opened this account, for Recently viewed. The server answers
// true or false; a failure is only logged, since it mustn't stop the account opening.
export const markAccountViewed = async (authToken: string, accountId: string) => {
  const path = `/AdviserDashboard/ViewAccount/${encodeURIComponent(accountId)}`;
  // getJson already logs a failed request
  const recorded = await getJson<boolean>(path, authToken);
  if (recorded === false) console.warn(`GET ${path} returned false`);
};

export const getAdviserBadgeCounts = (
  authToken: string
): Promise<AdviserBadgeCounts | null> =>
  ADVISER_MOCKS.badgeCounts
    ? mock(mockBadgeCounts)
    : getJson("/AdviserDashboard/BadgeCounts", authToken);
