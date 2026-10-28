import {
  getContributionCapSummary,
  getPensionLimitSummary,
  getEstimatedMemberStatement,
} from "./pimsApi";
import {
  ContributionCap,
  PensionLimitDetails,
  EstimatedMemberDetails,
} from "../navigation/types";

export type SuperData = {
  caps: ContributionCap | null;
  pension: PensionLimitDetails | null;
  balances: EstimatedMemberDetails[];
};

// Loads everything the Super tab shows (member statement covers the last 12 months)
export const fetchSuperData = async (
  authToken: string,
  accountId: string
): Promise<SuperData> => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(toDate.getFullYear() - 1);

  const [caps, pension, balances] = await Promise.all([
    getContributionCapSummary(authToken, accountId),
    getPensionLimitSummary(authToken, accountId),
    getEstimatedMemberStatement(authToken, accountId, fromDate, toDate),
  ]);

  return {
    caps,
    pension,
    balances: Array.isArray(balances) ? balances : [],
  };
};

// The Super tab is only shown when at least one of the APIs returns a member
export const hasSuperData = ({ caps, pension, balances }: SuperData) =>
  (caps?.members?.length ?? 0) > 0 ||
  (pension?.members?.length ?? 0) > 0 ||
  balances.length > 0;
