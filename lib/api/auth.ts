import { request } from "./client";
import type { AuthResponse, LoginRequest, ForgotPasswordRequest } from "../types/auth";
import type { ApiResponse } from "../types/common";

// ─── Auth Keys (for localStorage) ────────────────────────────────────────────
export const AUTH_TOKEN_KEY = "bps_token";
export const AUTH_USER_KEY = "bps_user";
export const AUTH_PERMISSIONS_KEY = "bps_permissions";
export const AUTH_MENU_KEY = "bps_menu";

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Returns token, user info, permissions, and menu structure
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await request<ApiResponse<AuthResponse>>("/auth/login", {
    method: "POST",
    body: data,
  });
  return response.data;
}

/**
 * POST /auth/forgot-password
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ApiResponse<null>> {
  return request<ApiResponse<null>>("/auth/forgot-password", {
    method: "POST",
    body: data,
  });
}

/**
 * POST /auth/logout
 */
export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearAuthData();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function saveAuthData(authData: AuthResponse): void {
  localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user));
  localStorage.setItem(AUTH_PERMISSIONS_KEY, JSON.stringify(authData.permissions));
  localStorage.setItem(AUTH_MENU_KEY, JSON.stringify(authData.menu));
}

export function clearAuthData(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_PERMISSIONS_KEY);
  localStorage.removeItem(AUTH_MENU_KEY);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredPermissions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredMenu() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_MENU_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
