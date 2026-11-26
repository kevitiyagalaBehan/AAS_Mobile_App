import { LoginResponse } from "../navigation/types";

export type ClientRoute = "Family" | "Other";
export type HomeRoute = ClientRoute | "Adviser";

// Which client layout an account opens in
export const clientRoute = (accountType?: string | null): ClientRoute =>
  accountType === "Family Group" ? "Family" : "Other";

// Where the user lands after login: advisers get their own layout,
// clients are routed by the type of the account they logged in to.
export const homeRoute = (
  user: Pick<LoginResponse, "userRole" | "accountType">
): HomeRoute =>
  user.userRole === "Adviser" ? "Adviser" : clientRoute(user.accountType);
