import { request } from "./client";

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
