import Cookies from "js-cookie";
import { request } from "./client";
import type { ApiResponse } from "../types/common";
import type {
  AuthResponseData,
  LoginRequest,
  User,
  UserPermissions,
} from "../types/auth";

// ─── Storage & Cookie Keys ───────────────────────────────────────────────────
export const AUTH_TOKEN_KEY = "bps_token";
export const AUTH_USER_KEY = "bps_user";
export const AUTH_PERMISSIONS_KEY = "bps_permissions";
export const AUTH_ROLE_KEY = "bps_role";

// ─── Authentication API Calls ─────────────────────────────────────────────────

/**
 * Login user via POST /auth/login
 * Payload: { email, password }
 */
export async function login(payload: LoginRequest): Promise<AuthResponseData> {
  const response = await request<ApiResponse<AuthResponseData>>("/auth/login", {
    method: "POST",
    body: {
      email: payload.email.trim(),
      password: payload.password,
    },
  });

  if (!response.data || !response.data.token) {
    throw new Error(response.message || "Invalid login response from server");
  }

  return response.data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Ignore network error on logout
  } finally {
    clearAuthData();
  }
}

export interface UserBalanceResponse {
  balance: number;
}

/**
 * Get current user balance via GET /user/balance
 * Response: { success: true, data: { balance: 0 } }
 */
export async function getUserBalance(): Promise<number> {
  const token = getStoredToken();
  const stored = getStoredUser();
  const fallback = typeof stored?.balance === "number" ? stored.balance : 0;

  if (!token) {
    return fallback;
  }

  try {
    const response = await request<{
      success: boolean;
      data?: { balance?: number };
    }>("/user/balance", {
      method: "GET",
    });

    if (response?.data && typeof response.data.balance === "number") {
      const liveBalance = response.data.balance;
      if (stored) {
        stored.balance = liveBalance;
        Cookies.set(AUTH_USER_KEY, JSON.stringify(stored), { expires: 7, path: "/", sameSite: "lax" });
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(stored));
        }
      }
      return liveBalance;
    }

    return fallback;
  } catch {
    // Silently fall back to cached balance on connection issues
    return fallback;
  }
}

// ─── Helpers: Cookie & Storage Management ─────────────────────────────────────

/**
 * Save authentication data to both Cookies (for SSR / Middleware) and localStorage
 */
export function saveAuthData(authData: AuthResponseData): void {
  const { token, user } = authData;

  const cookieOptions: Cookies.CookieAttributes = {
    expires: 7, // 7 days
    path: "/",
    sameSite: "lax",
  };

  // 1. Store in Cookies
  Cookies.set(AUTH_TOKEN_KEY, token, cookieOptions);
  Cookies.set(AUTH_USER_KEY, JSON.stringify(user), cookieOptions);
  if (user.role) {
    Cookies.set(AUTH_ROLE_KEY, user.role, cookieOptions);
  }
  if (user.permissions) {
    Cookies.set(AUTH_PERMISSIONS_KEY, JSON.stringify(user.permissions), cookieOptions);
  }

  // 2. Also keep in localStorage as fallback
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      if (user.role) {
        localStorage.setItem(AUTH_ROLE_KEY, user.role);
      }
      if (user.permissions) {
        localStorage.setItem(AUTH_PERMISSIONS_KEY, JSON.stringify(user.permissions));
      }
    } catch {
      // Storage quota or disabled storage
    }
  }
}

/**
 * Clear all authentication data from Cookies and localStorage
 */
export function clearAuthData(): void {
  // 1. Clear Cookies
  Cookies.remove(AUTH_TOKEN_KEY, { path: "/" });
  Cookies.remove(AUTH_USER_KEY, { path: "/" });
  Cookies.remove(AUTH_PERMISSIONS_KEY, { path: "/" });
  Cookies.remove(AUTH_ROLE_KEY, { path: "/" });

  // 2. Clear localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_PERMISSIONS_KEY);
      localStorage.removeItem(AUTH_ROLE_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Get stored token from Cookies or localStorage
 */
export function getStoredToken(): string | null {
  // Try Cookie first
  const cookieToken = Cookies.get(AUTH_TOKEN_KEY);
  if (cookieToken) return cookieToken;

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get stored user profile from Cookies or localStorage
 */
export function getStoredUser(): User | null {
  // Try Cookie first
  const cookieUser = Cookies.get(AUTH_USER_KEY);
  if (cookieUser) {
    try {
      return JSON.parse(cookieUser);
    } catch {
      // Fall through
    }
  }

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get stored user permissions
 */
export function getStoredPermissions(): UserPermissions | null {
  const cookiePerms = Cookies.get(AUTH_PERMISSIONS_KEY);
  if (cookiePerms) {
    try {
      return JSON.parse(cookiePerms);
    } catch {
      // Fall through
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(AUTH_PERMISSIONS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get stored user role from Cookies or localStorage
 */
export function getStoredUserRole(): string | null {
  const cookieRole = Cookies.get(AUTH_ROLE_KEY);
  if (cookieRole) return cookieRole;
  const user = getStoredUser();
  if (user?.role) return user.role;
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(AUTH_ROLE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if the user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}

