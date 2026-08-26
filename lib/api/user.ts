import { request } from "./client";
import type { User, UserPermissions } from "@/lib/types/auth";

export type UserStatusType = "active" | "inactive" | "suspended";

/**
 * Update user status / delete user via PATCH /user/:id/:status
 * Common across all modules (Admin, Branch, Branch User, Customer, Driver, Truck, etc.)
 * Statuses:
 * - "active" / "inactive" (Status Toggle)
 * - "suspended" (Delete User)
 */
export async function updateUserStatus(
  userId: string,
  status: UserStatusType
): Promise<{ success: boolean; message?: string }> {
  const response = await request<{ success: boolean; message?: string }>(
    `/user/${userId}/${status}`,
    {
      method: "PATCH",
    }
  );

  return response;
}

export interface UserDetailResponseData<T = unknown> {
  user?: T;
  [key: string]: unknown;
}

export interface UserDetailApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: UserDetailResponseData<T> | T;
}

/**
 * Fetch single user by ID via GET /user/:id
 */
export async function getUserById<T = unknown>(
  userId: string
): Promise<UserDetailApiResponse<T>> {
  const response = await request<UserDetailApiResponse<T>>(
    `/user/${userId}`,
    {
      method: "GET",
    }
  );

  return response;
}

export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AllUsersApiResponse {
  success: boolean;
  message?: string;
  data:
    | {
        users?: User[];
        items?: User[];
        data?: User[];
        [key: string]: unknown;
      }
    | User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Fetch all users list via GET /user/allUser
 */
export async function getAllUsers(
  params: GetAllUsersParams = {}
): Promise<AllUsersApiResponse> {
  const { page = 1, limit = 10, search = "", role, status } = params;

  const queryParams: Record<string, string | number> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (role) queryParams.role = role;
  if (status) queryParams.status = status;

  const response = await request<AllUsersApiResponse>("/user/allUser", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

export interface UserPermissionActionMap {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  [key: string]: boolean;
}

export interface UserPermissionItem {
  module: string;
  displayName: string;
  actions: UserPermissionActionMap;
  [key: string]: unknown;
}

export interface UserPermissionsApiResponse {
  success?: boolean;
  message?: string;
  data:
    | {
        permissions?: UserPermissionItem[];
        modules?: UserPermissionItem[];
        [key: string]: unknown;
      }
    | UserPermissionItem[];
}

/**
 * Fetch specific user's permissions via GET /user/permission/:id
 * Response: { data: { permissions: [ { module, actions: { view, add, edit, delete, export }, displayName } ] } }
 */
export async function getUserPermissionsById(userId: string): Promise<UserPermissionsApiResponse> {
  const response = await request<UserPermissionsApiResponse>(`/user/permission/${userId}`, {
    method: "GET",
  });
  return response;
}

/**
 * Update user permissions via PUT /user/permission/:id
 * Body: { permissions: [ { module, actions: { view, add, edit, delete, export }, displayName } ] }
 */
export async function updateUserPermissionsById(
  userId: string,
  permissions: UserPermissionItem[]
): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const response = await request<{ success: boolean; message?: string; data?: unknown }>(
    `/user/permission/${userId}`,
    {
      method: "PUT",
      body: { permissions },
    }
  );
  return response;
}


/**
 * Update user permissions via PUT /user/:role/:id or PUT /user/:id (legacy fallback)
 */
export async function updateUserPermissions(
  userId: string,
  permissions: UserPermissions,
  role?: string
): Promise<{ success: boolean; message?: string; data?: User }> {
  const targetRole = (role || "").toLowerCase();
  try {
    if (
      targetRole &&
      (targetRole === "admin" ||
        targetRole === "branch" ||
        targetRole === "staff" ||
        targetRole === "driver" ||
        targetRole === "truck")
    ) {
      return await request<{ success: boolean; message?: string; data?: User }>(
        `/user/${targetRole}/${userId}`,
        {
          method: "PUT",
          body: { permissions },
        }
      );
    }
    return await request<{ success: boolean; message?: string; data?: User }>(
      `/user/${userId}`,
      {
        method: "PUT",
        body: { permissions },
      }
    );
  } catch {
    return await request<{ success: boolean; message?: string; data?: User }>(
      `/user/${userId}`,
      {
        method: "PATCH",
        body: { permissions },
      }
    );
  }
}

