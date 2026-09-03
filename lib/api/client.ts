import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { refreshBadgesAndBalance } from "@/lib/refreshBadgesAndBalance";

// Base API configuration (Connecting to Node.js backend)
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const AUTH_TOKEN_KEY = "bps_token";
export const AUTH_USER_KEY = "bps_user";
export const AUTH_PERMISSIONS_KEY = "bps_permissions";
export const AUTH_ROLE_KEY = "bps_role";

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Automatically attaches Bearer Token to outgoing requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      Cookies.get(AUTH_TOKEN_KEY) ||
      (typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Server Time Tracking ───────────────────────────────────────────────────
let serverTimeOffset = 0;

/**
 * Returns the current reliable time synchronized with server headers
 */
export function getServerTime(): Date {
  return new Date(Date.now() + serverTimeOffset);
}

// ─── Auto Logout & Redirect Helper ───────────────────────────────────────────
export function performLogoutAndRedirect() {
  // 1. Remove all auth cookies
  Cookies.remove(AUTH_TOKEN_KEY, { path: "/" });
  Cookies.remove(AUTH_USER_KEY, { path: "/" });
  Cookies.remove(AUTH_PERMISSIONS_KEY, { path: "/" });
  Cookies.remove(AUTH_ROLE_KEY, { path: "/" });

  // 2. Remove all existing cookies
  try {
    const allCookies = Cookies.get();
    if (allCookies) {
      Object.keys(allCookies).forEach((cName) => {
        Cookies.remove(cName, { path: "/" });
        Cookies.remove(cName);
      });
    }
  } catch {
    // Ignore
  }

  // 3. Clear localStorage, sessionStorage and redirect to login
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_PERMISSIONS_KEY);
      localStorage.removeItem(AUTH_ROLE_KEY);
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore
    }

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }
}

// ─── Response Interceptor & Error Handling ────────────────────────────────────
// Formats errors and handles authentication expiration (401/400)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.headers && response.headers["date"]) {
      const serverTime = new Date(response.headers["date"]).getTime();
      if (!isNaN(serverTime)) {
        serverTimeOffset = serverTime - Date.now();
      }
    }

    // Check if 200 OK body contains error status 400/401
    const bodyStatus = response.data?.status ?? response.data?.statusCode ?? response.data?.code;
    if (bodyStatus === 400 || bodyStatus === 401 || bodyStatus === "400" || bodyStatus === "401") {
      performLogoutAndRedirect();
    } else {
      // Trigger debounced badges & balance update on successful mutating requests (POST, PUT, PATCH, DELETE)
      const method = (response.config.method || "").toLowerCase();
      const url = response.config.url || "";
      const isMutation = ["post", "put", "patch", "delete"].includes(method);
      const isExcluded =
        url.includes("/auth/login") ||
        url.includes("/auth/logout") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/verify-otp") ||
        url.includes("/user/badges") ||
        url.includes("/user/balance");

      if (isMutation && !isExcluded) {
        refreshBadgesAndBalance();
      }
    }

    return response;
  },
  (error: AxiosError<{ message?: string; error?: string; status?: number | string; statusCode?: number | string; errors?: Record<string, string[]> | string[] }>) => {
    let errorMessage = "Something went wrong. Please try again.";

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      // Extract error message from API response
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      } else if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMessage = data.errors.join(", ");
        } else if (typeof data.errors === "object") {
          errorMessage = Object.values(data.errors).flat().join(", ");
        }
      } else if (status === 400) {
        errorMessage = "Bad request. Please verify your data.";
      } else if (status === 401) {
        errorMessage = "Unauthorized. Please login again.";
      } else if (status === 403) {
        errorMessage = "You do not have permission to perform this action.";
      } else if (status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      // Check HTTP status 400/401 OR body status 400/401 -> Logout & Clear Storage
      const bodyStatus = data?.status ?? data?.statusCode ?? data?.code;
      if (
        status === 400 ||
        status === 401 ||
        bodyStatus === 400 ||
        bodyStatus === 401 ||
        bodyStatus === "400" ||
        bodyStatus === "401"
      ) {
        performLogoutAndRedirect();
      }
    } else if (error.request) {
      // Network error or server not reachable
      errorMessage = "Network error: Unable to connect to the backend server.";
    } else {
      errorMessage = error.message || errorMessage;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// ─── Generic Request Helper ───────────────────────────────────────────────────
export interface ApiRequestOptions extends AxiosRequestConfig {
  body?: unknown;
}

/**
 * Universal request wrapper returning response data directly
 */
export async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, headers, ...rest } = options;

  const response = await apiClient.request<T>({
    url: endpoint,
    method,
    data: body,
    params,
    headers,
    ...rest,
  });

  return response.data;
}

export default apiClient;
