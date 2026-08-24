import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

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

// ─── Response Interceptor & Error Handling ────────────────────────────────────
// Formats errors and handles authentication expiration (401)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string; errors?: Record<string, string[]> | string[] }>) => {
    let errorMessage = "Something went wrong. Please try again.";

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

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
        // Auto logout on 401
        Cookies.remove(AUTH_TOKEN_KEY, { path: "/" });
        Cookies.remove(AUTH_USER_KEY, { path: "/" });
        Cookies.remove(AUTH_PERMISSIONS_KEY, { path: "/" });
        Cookies.remove(AUTH_ROLE_KEY, { path: "/" });

        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_PERMISSIONS_KEY);
            localStorage.removeItem(AUTH_ROLE_KEY);
          } catch {
            // Ignore
          }
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      } else if (status === 403) {
        errorMessage = "You do not have permission to perform this action.";
      } else if (status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (status >= 500) {
        errorMessage = "Server error. Please try again later.";
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
