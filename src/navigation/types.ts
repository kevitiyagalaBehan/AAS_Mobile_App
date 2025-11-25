import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ReactNode } from "react";

export type AuthContextType = {
  userData: LoginResponse | null;
  setUserData: React.Dispatch<React.SetStateAction<LoginResponse | null>>;
  currentUserName: string | null;
  setCurrentUserName: React.Dispatch<React.SetStateAction<string | null>>;
  currentAccountName: string | null;
  setCurrentAccountName: React.Dispatch<React.SetStateAction<string | null>>;
  entityAccounts: AccountEntity[];
  setEntityAccounts: React.Dispatch<React.SetStateAction<AccountEntity[]>>;
  loggedInUser: LinkedUsers | null;
  setLoggedInUser: (user: LinkedUsers | null) => void;
  pendingNavigation: PendingNavigation;
  setPendingNavigation: (nav: PendingNavigation) => void;

  resetAuthState: () => void;
};

export type AuthProviderProps = {
  children: ReactNode;
};

// Root Stack Navigation
export type RootStackParamList = {
  Login: undefined;
  Other: { screen?: string; params?: object };
  Family: { screen?: string; params?: object };
};

// Bottom Tab Navigation
export type BottomTabParamListOther = {
  HomeOther: { authToken: string; accountId: string };
  Inbox: { authToken: string; accountId: string };
  ESigning: { authToken: string; accountId: string };
  Menu: { authToken: string; accountId: string };
};

export type BottomTabParamListFamily = {
  HomeFamily: { authToken: string; accountId: string };
  Inbox: { authToken: string; accountId: string };
  ESigning: { authToken: string; accountId: string };
  Menu: { authToken: string; accountId: string };
};

// Drawer Navigation
export type DrawerParamListOther = {
  MainTabs: { authToken: string; accountId: string };
  Details: { authToken: string; accountId: string };
  Transactions: { authToken: string; accountId: string };
  Portfolio: { authToken: string; accountId: string };
  Document: { authToken: string; accountId: string };
};

export type DrawerParamListFamily = {
  MainTabs: { authToken: string; accountId: string };
};

export type InboxStackParamList = {
  InboxList: { authToken: string; accountId: string };
  InboxDetail: { queryId: string; title: string };
};

export type InboxStackNavigationProp<T extends keyof InboxStackParamList> =
  StackNavigationProp<InboxStackParamList, T>;

export type InboxRouteProp<T extends keyof InboxStackParamList> = RouteProp<
  InboxStackParamList,
  T
>;

export type SubScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Other" | "Family"
>;

export type PendingNavigation = {
  userType: "Family" | "Other";
  screen: string;
  params: any;
} | null;

export type Props = {
  refreshing: boolean;
  refreshTrigger: number;
};

export type NavigationProps = {
  replace: (screen: string) => void;
};

export type InboxNotificationActionData = {
  Subject: string;
  MessageId: string;
};

export interface ClientAccountDetails {
  superFundName: string;
}

export interface LinkedUsers {
  fullName: string;
  isCurrent: boolean;
  //assignedAccount: string;
  assignedAccountType?: string;
  emailAddress?: string;
  role?: string;
  userId?: string;
}

export interface LoginResponse {
  authToken: string;
  accountId: string;
  accountType: string;
}

export interface AssetAllocationSummary {
  assetCategory: string;
  assetClass: string;
  marketValue: number;
  marketPercentage: number;
  order: number;
}

export interface AssetClass {
  assetClass: string;
  marketValue: number;
  percentage: number;
}

export interface AssetCategory {
  assetCategory: string;
  marketValue: number;
  percentage: number;
  assetClasses?: AssetClass[];
}

export interface PortfolioData {
  assetCategories: AssetCategory[];
  totalMarketValue: number;
  totalPercentage: number;
}

export interface ChartData {
  name: string;
  percentage: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface SuperFundDetails {
  dataDownDate: string;
  year: number;
  clientTotal: number;
}

export interface TopTenInvestmentDetails {
  code: string;
  description: string;
  quantity: number;
  value: number;
  percentage: number;
}

export interface TopTenInvestmentDetailsFamily {
  code: string;
  id: string;
  owner: string;
  marketValue: number;
  marketPercentage: number;
}

export type PortfolioItem = {
  year: number;
  value: number;
  dataDownDate: string;
};

// Selected item when clicking on a bar
export type SelectedData = {
  clientTotal: number;
  dataDownDate: string;
  year: number;
};

export interface ContributionCap {
  accountName: string;
  financialYear: {
    endDate: string;
    financialYear: string;
    id: string;
    isCurrent: boolean;
    startDate: string;
  };
  members: {
    age: number;
    birthDate: string;
    concessionalAvailable: number;
    concessionalMaximum: number;
    concessionalPaidToDate: number;
    name: string;
    nonConcessionalAvailable: number;
    nonConcessionalMaximum: number;
    nonConcessionalPaidToDate: number;
  }[];
}

export interface PensionLimitDetails {
  accountName: string;
  financialYear: {
    endDate: string;
    financialYear: string;
    id: string;
    isCurrent: boolean;
    startDate: string;
  };
  members: {
    age: number;
    birthDate: string;
    drawdownsToDate: number;
    maximumPensionAmount: number;
    minimumPaidToDate: number;
    minimumPensionAmount: number;
    name: string;
    remainingToMaximum: number;
    requiredForMinimum: number;
  }[];
}

export interface EstimatedMemberDetails {
  accumulation: number;
  memberName: string;
  pension: number;
  taxFree: number;
  taxableTaxed: number;
  taxableUntaxed: number;
}

export interface InvestmentPerformanceDetails {
  cumulativePercent: number;
  date: string;
}

export interface ForgotPassword {
  message: string;
  success: boolean;
}

export interface Comment {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface Inbox {
  id: string;
  title: string;
  lastCommentDate: string;
  comments: Comment[];
}

export interface AccountEntity {
  accountName: string;
  accountType: string;
  activePortfolio: string;
  id: string;
  tfn?: string;
  abn?: string;
}

export interface AccountIndividual {
  accountName: string;
  accountCode: string;
  dob: string;
  email: string;
  id: string;
  relationship: string;
}

export interface AccountListResponse {
  entities: AccountEntity[];
  individuals: AccountIndividual[];
}

export interface AccountOption {
  key: string;
  value: string;
  accountType: string;
}

export interface ConsolidateData {
  clientCode: string;
  clientId: string;
  clientName: string;
  entityType: string;
  portfolioPercentage: number;
  portfolioValue: number;
}

export interface ClientAccountDetails {
  superFundCode: string;
  superFundName: string;
  legalType: string;
  portfolioType: string;
  fundABN: string;
  soaDate: string;
  fundTFN: string;
  fundStartDate: string;
  trusteeName: string;
  jobType: string;
  reportTagName: string;
  adviserName: string;
  adviserNameLast: string;
}

export interface Signatory {
  esigningDetailId: string | null;
  esigningStatus: "Signed" | null;
  signatoryEmail: string;
  signatoryName: string;
}

export interface DocumentFile {
  documentName: string;
  documentPath: string;
}

export interface EsignDocument {
  accountId: string;
  accountName: string;
  companyId: string;
  companyName: string;
  documentPath: string;
  documents: DocumentFile[];
  dueDate: string;
  esigningCode: string;
  esigningId: string;
  sentBy: string;
  sentDate: string;
  signatories: Signatory[];
  subject: string;
  tags: string;
}

export interface CashTransactions {
  balance: number;
  classification: string;
  credit: number | null;
  debit: number | null;
  holdingCode: string;
  holdingDescription: string;
  id: string;
  isDefault: boolean;
  transactionAmount: number;
  transactionDate: string;
  transactionDescription: string;
}

export interface Messages {
  commentCount: number;
  description: string;
  fileCount: number;
  fromPIMS: boolean;
  id: string;
  uploadedBy: string;
  uploadedById: string;
  uploadedByLevel: string;
  uploadedDate: number;
}

export interface Comments {
  author: string;
  comment: string;
  date: number;
  id: string;
  isCurrentUser: boolean;
  isFirst: boolean;
  userId: string;
}

export interface Investment {
  assetCategory: string;
  assetClass: string;
  bookCost: number;
  code: string;
  description: string;
  income: number;
  isDefaultCash: boolean;
  marketPercentage: number;
  marketTypeValue: string;
  marketValue: number;
  order: number;
  price: number;
  quantity: number;
  yield: number;
}

export interface Settings {
  column_BookCost: boolean;
  column_EstIncome: boolean;
  column_EstYield: boolean;
  column_GainLosses: boolean;
}

export interface InvestmentsResponse {
  investments: Investment[];
  settings: Settings;
}

export interface Relationships {
  id: string;
  masterAccountId: string;
  relationId: string;
  relationship: string;
}

export interface RelationshipResponse {
  accountCode: string;
  accountId: string;
  accountName: string;
  accountSource: string;
  accountType: string | null;
  email: string;
  emailRecipientType: string | null;
  id: string;
  mobile: string | null;
  relationships: Relationships[];
}

export interface Folders {
  name: string;
  lastModifiedDate: string | null;
  type: string;
  fileType: string | null;
}

export interface Documents {
  id: string;
  name: string;
  folder: string;
  fullPath: string;
  lastModified: string;
  extension: string;
  sizeText: string;
}

export interface NotifyRecipient {
  emailAddress: string;
  id: string;
  name: string;
  ref: string;
}

export interface UserRecipient {
  id: string;
  name: string;
  emailAddress: string;
}

export interface Attachment {
  DisplayName: string;
  FilePath: string;
  Id: string;
}

export interface InboxMessage {
  Description: string;
  Message: string;
  Date: string;
  UserId: string;
  Attachments: Attachment[];
}
