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

export interface AdminPayload {
  name: string;
  email: string;
  mobile: string;
  status: string;
  password?: string;
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
 * Create Admin via POST /user/admin
 * Payload: { name, email, mobile, password, status }
 */
export async function createAdmin(
  payload: AdminPayload
): Promise<{ success: boolean; message?: string; data?: AdminUser }> {
  return await request<{ success: boolean; message?: string; data?: AdminUser }>("/user/admin", {
    method: "POST",
    body: payload,
  });
}

/**
 * Update Admin via PUT /user/admin/:id or PUT /user/admin
 * Payload: { name, email, mobile, password, status }
 */
export async function updateAdmin(
  userId: string,
  payload: AdminPayload
): Promise<{ success: boolean; message?: string; data?: AdminUser }> {
  try {
    return await request<{ success: boolean; message?: string; data?: AdminUser }>(
      `/user/admin/${userId}`,
      {
        method: "PUT",
        body: payload,
      }
    );
  } catch {
    return await request<{ success: boolean; message?: string; data?: AdminUser }>("/user/admin", {
      method: "PUT",
      body: { ...payload, _id: userId, id: userId },
    });
  }
}
