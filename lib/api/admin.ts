import { request } from "./client";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: "active" | "inactive" | string;
  [key: string]: unknown;
}

export interface AdminListResponseData {
  users: AdminUser[];
}

export interface AdminPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminListApiResponse {
  success: boolean;
  message?: string;
  data: AdminListResponseData;
  pagination?: AdminPaginationMeta;
}

export interface GetAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Fetch Admins list via GET /user/role/admin?page=1&limit=10
 */
export async function getAdmins(params: GetAdminsParams = {}): Promise<AdminListApiResponse> {
  const { page = 1, limit = 10, search = "" } = params;

  const queryParams: Record<string, string | number> = {
    page,
    limit,
  };
  if (search) {
    queryParams.search = search;
  }

  const response = await request<AdminListApiResponse>("/user/role/admin", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

/**
 * Update user status / delete user via PATCH /user/:id/:status
 * Statuses:
 * - "active" / "inactive" (Status Toggle)
 * - "suspended" (Delete User)
 */
export async function updateUserStatus(
  userId: string,
  status: "active" | "inactive" | "suspended"
): Promise<{ success: boolean; message?: string }> {
  const response = await request<{ success: boolean; message?: string }>(
    `/user/${userId}/${status}`,
    {
      method: "PATCH",
    }
  );

  return response;
}
