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
