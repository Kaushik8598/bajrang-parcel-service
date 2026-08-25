import { request } from "./client";

export interface DrivingLicenseDoc {
  number?: string;
  image?: string;
  expiryDate?: string;
  [key: string]: unknown;
}

export interface DriverInfo {
  mobile2?: string;
  address?: string;
  city?: string;
  drivingLicense?: DrivingLicenseDoc;
  [key: string]: unknown;
}

export interface DriverUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: "active" | "inactive" | string;
  driverInfo?: DriverInfo;
  [key: string]: unknown;
}

export interface DriverListResponseData {
  users: DriverUser[];
}

export interface DriverPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DriverListApiResponse {
  success: boolean;
  message?: string;
  data: DriverListResponseData;
  pagination?: DriverPaginationMeta;
}

export interface GetDriversParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DriverPayload {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  status?: string;
  driverInfo?: DriverInfo;
  [key: string]: unknown;
}

/**
 * Fetch Drivers list via GET /user/role/driver?page=1&limit=10&search=test
 */
export async function getDrivers(params: GetDriversParams = {}): Promise<DriverListApiResponse> {
  const { page = 1, limit = 10, search = "" } = params;

  const queryParams: Record<string, string | number> = {
    page,
    limit,
  };
  if (search) {
    queryParams.search = search;
  }

  const response = await request<DriverListApiResponse>("/user/role/driver", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

/**
 * Create Driver via POST /user/driver
 */
export async function createDriver(
  payload: DriverPayload
): Promise<{ success: boolean; message?: string; data?: DriverUser }> {
  return await request<{ success: boolean; message?: string; data?: DriverUser }>("/user/driver", {
    method: "POST",
    body: payload,
  });
}

/**
 * Update Driver via PUT /user/driver/:id
 */
export async function updateDriver(
  userId: string,
  payload: DriverPayload
): Promise<{ success: boolean; message?: string; data?: DriverUser }> {
  return await request<{ success: boolean; message?: string; data?: DriverUser }>(
    `/user/driver/${userId}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}
