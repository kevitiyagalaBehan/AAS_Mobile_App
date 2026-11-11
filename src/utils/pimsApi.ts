import {
  LoginResponse,
  LinkedUsers,
  SuperFundDetails,
  TopTenInvestmentDetails,
  TopTenInvestmentDetailsFamily,
  PortfolioData,
  AssetAllocationSummary,
  ContributionCap,
  ContributionCapDetailed,
  FinancialYear,
  PensionLimitDetails,
  PensionLimitMember,
  EstimatedMemberDetails,
  InvestmentPerformanceDetails,
  ForgotPassword,
  AccountEntity,
  ClientAccountDetails,
  ConsolidateData,
  AccountListResponse,
  AccountIndividual,
  EsignDocument,
  CashTransactions,
  Messages,
  Comments,
  InvestmentsResponse,
  RelationshipResponse,
  Documents,
  NotifyRecipient,
  InboxMessage,
  Folders,
  RegisterPinResult,
  PinLoginResult,
  LoginResult,
  DeviceInfo,
  PracticeInfo,
  RevokePinResult,
  ClientProfile,
} from "../navigation/types";
import Constants from "expo-constants";
import { Base64 } from "js-base64";
import { Buffer } from "buffer";

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string;

//console.log("API:", apiBaseUrl);
//console.log("ENV:", appEnv);
//console.log("PROJECT_ID:", projectId);

// ---------------------------------------------------------------------------
// /mobile-auth endpoints
// ---------------------------------------------------------------------------

// Values never written to the log, in requests or responses.
const REDACTED_KEYS = new Set([
  "password",
  "pin",
  "auth_token",
  "device_token",
  "deviceToken",
  "pushToken",
]);

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        REDACTED_KEYS.has(key) && v != null ? "***" : redact(v),
      ])
    );
  }
  return value;
};

interface ApiReply {
  status: number;
  data: any | null;
}

// POSTs to a /mobile-auth endpoint. Reads the reply as text first, so a non-JSON reply
// (e.g. an empty 401) still reports its status code. Logs only in development builds.
const postMobileAuth = async (
  path: string,
  body?: object,
  authToken?: string
): Promise<ApiReply> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${apiBaseUrl}/mobile-auth/${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Not JSON; callers treat a null body as a failure.
  }

  if (__DEV__) {
    console.log(`[mobile-auth/${path}]`, {
      request: redact(body ?? null),
      status: response.status,
      response: data !== null ? redact(data) : text.slice(0, 200),
    });
  }

  return { status: response.status, data };
};

const parsePractice = (practice: any): PracticeInfo | null => {
  if (!practice || practice.practice_id == null) return null;
  return {
    practiceId: practice.practice_id,
    practiceBrand: practice.practice_brand ?? null,
    practiceName: practice.practice_name ?? null,
    logoUrl: practice.logo_url || null,
    logoVersion: practice.logo_version != null ? String(practice.logo_version) : null,
  };
};

const parseLogin = (data: any): LoginResponse => ({
  authToken: data.auth_token,
  accountId: data.account_id,
  accountType: data.account_type,
});

export const loginUser = async (
  username: string,
  password: string,
  deviceInfo: DeviceInfo
): Promise<LoginResult> => {
  try {
    const { status, data } = await postMobileAuth("login", {
      username,
      password,
      deviceInfo,
    });

    if (data?.success === true) {
      return {
        success: true,
        login: parseLogin(data),
        practice: parsePractice(data.practice),
      };
    }

    return {
      success: false,
      message: data?.message || `Unable to log in (error ${status}). Please try again.`,
    };
  } catch (error) {
    console.error("Login failed:", error);
    return {
      success: false,
      message: "Unable to log in. Please check your connection.",
    };
  }
};

// Called on every launch. Failures are ignored; the next launch tries again.
export const registerDevice = async (deviceInfo: DeviceInfo): Promise<void> => {
  try {
    await postMobileAuth("register-device", deviceInfo);
  } catch (error) {
    console.warn("Device registration failed:", error);
  }
};

// Called on logout. It only updates a status on the server, so failures (including a
// 401 after auto-logout with an expired token) are ignored.
export const logoutAllDevices = async (authToken: string): Promise<void> => {
  try {
    await postMobileAuth("logout-all-devices", undefined, authToken);
  } catch (error) {
    console.warn("Logout from all devices failed:", error);
  }
};


export const requestPasswordReset = async (
  email: string
): Promise<ForgotPassword | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}/Auth/ResetPasswordRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email 
      }),
    });

    if (!response.ok) {
      throw new Error("Password reset request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw error;
  }
};


export const registerPin = async (
  authToken: string,
  pin: string,
  deviceInfo: DeviceInfo
): Promise<RegisterPinResult> => {
  try {
    const { status, data } = await postMobileAuth(
      "register-pin",
      { pin, deviceInfo },
      authToken
    );

    if (data?.success === true && data.device_token) {
      return { success: true, deviceToken: data.device_token };
    }

    return {
      success: false,
      message:
        data?.message || `Unable to set up PIN (error ${status}). Please try again.`,
    };
  } catch (error) {
    console.error("PIN registration failed:", error);
    return {
      success: false,
      message: "Unable to set up PIN. Please check your connection.",
    };
  }
};


export const loginWithPin = async (
  deviceToken: string,
  pin: string,
  deviceInfo: DeviceInfo
): Promise<PinLoginResult> => {
  try {
    const { status, data } = await postMobileAuth("pin-login", {
      pin,
      deviceToken,
      deviceInfo,
    });

    if (!data) {
      return {
        status: "error",
        message: `Unable to log in (error ${status}). Please try again.`,
      };
    }

    if (data.success === true) {
      return {
        status: "success",
        login: parseLogin(data),
        newDeviceToken: data.device_token ?? null,
        practice: parsePractice(data.practice),
      };
    }

    if (data.pin_disabled === true) {
      return {
        status: "disabled",
        message:
          data.message ||
          "PIN login has been disabled on this device. Please log in with your password.",
        code: data.pin_disabled_code ?? null,
      };
    }

    // The server includes the remaining attempts in the message.
    return {
      status: "invalid",
      message: data.message || "Incorrect PIN.",
      remainingAttempts:
        typeof data.remaining_attempts === "number"
          ? data.remaining_attempts
          : null,
    };
  } catch (error) {
    console.error("PIN login failed:", error);
    return {
      status: "error",
      message: "Unable to log in. Please check your connection.",
    };
  }
};


export const revokePin = async (
  authToken: string,
  deviceId: string
): Promise<RevokePinResult> => {
  try {
    const { status, data } = await postMobileAuth(
      "revoke-pin",
      { deviceId },
      authToken
    );

    if (data?.success === true) {
      return { success: true };
    }

    return {
      success: false,
      message:
        data?.message ||
        `Couldn't turn off PIN login (error ${status}). Please try again.`,
    };
  } catch (error) {
    console.error("PIN revoke failed:", error);
    return {
      success: false,
      message: "Couldn't turn off PIN login. Please check your connection and try again.",
    };
  }
};


export const getSuperFundName = async (
  authToken: string,
  accountId: string
): Promise<ClientAccountDetails[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientAccountDetails/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch linked users");
    }

    const data: ClientAccountDetails[] = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching linked users:", error);
    return null;
  }
};


export const getLinkedUsers = async (
  authToken: string
): Promise<LinkedUsers | null> => {
  try {
    //console.log("Fetching linked users with token:", authToken);
    const response = await fetch(`${apiBaseUrl}/Auth/LinkedUsers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch linked users");
    }

    const data: LinkedUsers[] = await response.json();

    return data.find((user) => user.isCurrent === true) || null;
  } catch (error) {
    console.error("Error fetching linked users:", error);
    return null;
  }
};


export const savePushToken = async (
  pushToken: string,
  authToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${apiBaseUrl}/Auth/mobile/refresh_expo_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        expoToken: pushToken,
      }),
    });

    const data = await response.json();
    //console.log("Response JSON:", data);
    return data.success === true;
  } catch (error) {
    console.error("Failed to save push token:", error);
    return false;
  }
};


export const getEntityAccounts = async (
  authToken: string,
  accountId: string,
  parentAccount?: AccountEntity
): Promise<AccountEntity[]> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/FamilyGroupDashboard/AccountList/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch account entities");
    }

    const data: AccountListResponse = await response.json();

    const filteredEntities =
      data.entities?.filter((entity) => entity.activePortfolio === "Yes") || [];

    if (parentAccount) {
      return [parentAccount, ...filteredEntities];
    }

    return filteredEntities;
  } catch (error) {
    console.error("Error fetching account entities:", error);
    return parentAccount ? [parentAccount] : [];
  }
};


export const getAccountList = async (
  authToken: string,
  accountId: string
): Promise<{
  entities: AccountEntity[];
  individuals: AccountIndividual[];
}> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/FamilyGroupDashboard/AccountList/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch account list");
    }

    const data: AccountListResponse = await response.json();

    return {
      entities: data.entities || [],
      individuals: data.individuals || [],
    };
  } catch (error) {
    console.error("Error fetching account list:", error);

    return {
      entities: [],
      individuals: [],
    };
  }
};


export const getAssetAllocationSummaryOther = async (
  authToken: string,
  accountId: string
): Promise<PortfolioData | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDashboard/AssetAllocationSummary/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: PortfolioData = await response.json();
    //console.log("Raw API response:", data);
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getAssetAllocationSummaryFamily = async (
  authToken: string,
  accountId: string
): Promise<AssetAllocationSummary[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/FamilyGroupDashboard/AssetAllocationSummary/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: AssetAllocationSummary[] = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getSuperFundDetails = async (
  authToken: string,
  accountId: string
): Promise<SuperFundDetails[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/InvestmentGraphPortfolioBalanceSummaryGraph/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    //console.log("Super Fund Data:", data);

    if (Array.isArray(data) && data.length > 0) {
      return data;
    } else {
      //console.warn("Unexpected API structure", data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching portfolio balance summary:", error);
    return null;
  }
};


export const getTopTenInvestmentDetails = async (
  authToken: string,
  accountId: string
): Promise<TopTenInvestmentDetails[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDashboard/TopTenInvestments/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response");
    }

    return data as TopTenInvestmentDetails[];
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getTopTenInvestmentDetailsFamily = async (
  authToken: string,
  accountId: string
): Promise<TopTenInvestmentDetailsFamily[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/FamilyGroupDashboard/TopTenInvestments/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response");
    }

    return data as TopTenInvestmentDetailsFamily[];
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getContributionCapSummary = async (
  authToken: string,
  accountId: string
): Promise<ContributionCap | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDashboard/ContributionCapSummary/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: ContributionCap = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getFinancialYears = async (
  authToken: string
): Promise<FinancialYear[] | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}/FinancialYear/All`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? (data as FinancialYear[]) : null;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


// "CCMaximum" -> "ccMaximum", "MemberName" -> "memberName". Leaves camelCase keys as-is.
const camelKey = (key: string) => key.replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, (m) => m.toLowerCase());

const toCamelKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toCamelKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [camelKey(k), toCamelKeys(v)])
    );
  }
  return value;
};

export const getContributionCapDetailed = async (
  authToken: string,
  superFundId: string,
  financialYearId: string
): Promise<ContributionCapDetailed[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ContributionCap/Detailed/${superFundId}/${financialYearId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data)
      ? (data.map(toCamelKeys) as ContributionCapDetailed[])
      : null;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getPensionLimitMembers = async (
  authToken: string,
  superFundId: string,
  financialYearId: string
): Promise<PensionLimitMember[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/PensionsContributions/PensionLimitMembers/${superFundId}/${financialYearId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data)
      ? (data.map(toCamelKeys) as PensionLimitMember[])
      : null;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getPensionLimitSummary = async (
  authToken: string,
  accountId: string
): Promise<PensionLimitDetails | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDashboard/PensionLimitSummary/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: PensionLimitDetails = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getEstimatedMemberStatement = async (
  authToken: string,
  accountId: string,
  fromDate: Date,
  toDate: Date
): Promise<EstimatedMemberDetails[] | null> => {
  try {
    const formatDate = (date: Date) => encodeURIComponent(date.toUTCString());

    const formattedFromDate = formatDate(fromDate);
    const formattedToDate = formatDate(toDate);

    const url = `${apiBaseUrl}/ClientDashboard/EstimatedMemberStatement/${accountId}/${formattedFromDate}/${formattedToDate}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // One entry per member
    const data: EstimatedMemberDetails[] = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getInvestmentPerformance = async (
  authToken: string,
  accountId: string
): Promise<InvestmentPerformanceDetails[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDashboard/InvestmentPerformance/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response");
    }

    return data as InvestmentPerformanceDetails[];
  } catch (error) {
    console.error(
      "Fetch failed:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};


export const getConsolidateData = async (
  authToken: string,
  accountId: string
): Promise<ConsolidateData[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/FamilyGroupDashboard/ConsolidateData/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response");
    }

    return data as ConsolidateData[];
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getClientProfile = async (
  authToken: string,
  accountId: string
): Promise<ClientProfile | null> => {
  const response = await fetch(`${apiBaseUrl}/ClientProfile/${accountId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
};


export const getClientAccountDetails = async (
  authToken: string,
  accountId: string
): Promise<ClientAccountDetails[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientAccountDetails/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response");
    }

    return data as ClientAccountDetails[];
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getEsignDocuments = async (
  authToken: string,
  accountId: string
): Promise<EsignDocument[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/Esigning/CurrentUserV3/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.status}`);
    }
    const data = await response.json();
    //console.log("Data:", data);
    return data as EsignDocument[];
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


export const getCashTransactions = async (
  authToken: string,
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<CashTransactions[] | null> => {
  try {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const start = startDate ?? formatDate(lastMonth);
    const end = endDate ?? formatDate(today);

    const response = await fetch(
      `${apiBaseUrl}/CashTransactionsV2/${accountId}/${start}/${end}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();
    return data as CashTransactions[];
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


export const getMessages = async (
  authToken: string,
  accountId: string
): Promise<Messages[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDocumentUpload/${accountId}/Inbox/V2`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    const data = await response.json();
    //console.log("Data:", data);
    return data as Messages[];
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


export const loadComments = async (
  authToken: string,
  accountId: string,
  id: string
): Promise<Comments[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDocumentUpload/${accountId}/UploadedDocuments/${id}/Comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }

    const data = await response.json();
    return data as Comments[];
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


export const sendComment = async (
  authToken: string,
  accountId: string,
  id: string,
  comment: string,
  userId: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDocumentUpload/${accountId}/UploadedDocuments/${id}/AddComment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          commentText: comment, 
          UserId: userId 
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send comment: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("API Error:", error);
    return false;
  }
};


export const deleteComment = async (
  authToken: string,
  accountId: string,
  commentId: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDocumentUpload/${accountId}/RemoveDocumentComment/${commentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          commentId 
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("API Error:", error);
    return false;
  }
};


export const getInvestments = async (
  authToken: string,
  accountId: string
): Promise<InvestmentsResponse> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `${apiBaseUrl}/InvestmentPortfolio/${accountId}/${today}/WithSettings`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch investments: ${response.status} ${response.statusText}`
      );
    }

    const data: InvestmentsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching investments:", error);
    throw error;
  }
};


export const getRelationships = async (
  authToken: string,
  accountId: string
): Promise<RelationshipResponse[]> => {
  try {
    const response = await fetch(`${apiBaseUrl}/Relationships/${accountId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch relationships: ${response.status} ${response.statusText}`
      );
    }

    const data: RelationshipResponse[] = await response.json();
    //console.log("Data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching relationships:", error);
    throw error;
  }
};


export const getAASDocumentRoot = async (
  accountId: string,
  authToken: string
): Promise<string | null> => {
  try {
    const res = await fetch(
      `${apiBaseUrl}/ClientDocuments/AASDocumentRoot/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch root path");

    const rootPath = await res.text();
    return rootPath;
  } catch (err) {
    console.error("Error fetching root path:", err);
    return null;
  }
};


export const getFolderPath = async (
  path: string,
  authToken: string
): Promise<Folders[] | null> => {
  try {
    const encodedPath = Base64.encode(path);
    const res = await fetch(
      `${apiBaseUrl}/ClientDocuments/AASDocuments/${encodedPath}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!res.ok) return null;
    //if (!res.ok) throw new Error("Failed to fetch folders");

    const data = await res.json();
    return data as Folders[];
  } catch (err) {
    console.error("Error fetching folders by path:", err);
    return null;
  }
};


export const getAASDocuments = async (
  path: string,
  authToken: string
): Promise<Documents[] | null> => {
  try {
    const encodedPath = Base64.encode(path);
    const response = await fetch(
      `${apiBaseUrl}/ClientDocuments/AASDocumentList/${encodedPath}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response");
    }

    return data as Documents[];
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
};


export const getDocumentViewUrl = async (
  encodedPath: string,
  authToken: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientDocuments/AASDocumentViewPath?Path=${encodedPath}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const url = await response.text();
    return url;
  } catch (error) {
    console.error("Failed to fetch document view URL:", error);
    return null;
  }
};


export const getNotifyRecipient = async (
  authToken: string,
  accountId: string
): Promise<NotifyRecipient[] | null> => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/ClientMessage/NotifyRecipients/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch recipients: ${response.status}`);
    }
    const data = await response.json();
    //console.log("Data:", data);
    return data as NotifyRecipient[];
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};


export const sendInboxMessage = async (
  authToken: string,
  accountId: string,
  message: InboxMessage
): Promise<void> => {
  const response = await fetch(
    `${apiBaseUrl}/ClientDocumentUpload/${accountId}/Inbox/Upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
};


export const sendEmailNotification = async (
  authToken: string,
  accountId: string,
  subject: string,
  message: string,
  recipients: { DisplayName: string; EmailAddress: string; Type: string }[]
) => {
  const payload = {
    Subject64Bit: Buffer.from(subject).toString("base64"),
    Content64Bit: Buffer.from(message).toString("base64"),
    Recipients: recipients,
    Attachments: [],
    SendEnabled: true,
    Ref: "",
    RefId: "",
  };

  const response = await fetch(`${apiBaseUrl}/Emailing/Email/${accountId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email send failed: ${errorText}`);
  }

  return response.json();
};
