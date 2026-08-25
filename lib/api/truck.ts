import { request } from "./client";

export interface TruckDocItem {
  number?: string;
  expiryDate?: string;
  image?: string;
  [key: string]: unknown;
}

export interface TruckDocuments {
  rc?: TruckDocItem;
  puc?: TruckDocItem;
  insurance?: TruckDocItem;
  fitness?: TruckDocItem;
  permit?: TruckDocItem;
  [key: string]: unknown;
}

export interface TruckOwnerDetail {
  name?: string;
  mobile?: string;
  [key: string]: unknown;
}

export interface TruckDriver {
  _id: string;
  name?: string;
  mobile?: string;
  driverInfo?: {
    mobile2?: string;
    city?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TruckInfo {
  ownerDetail?: TruckOwnerDetail;
  documents?: TruckDocuments;
  truckNumber?: string;
  truckImage?: string;
  driverId?: TruckDriver | string;
  capacity?: number;
  [key: string]: unknown;
}

export interface TruckUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: "active" | "inactive" | string;
  truckInfo?: TruckInfo;
  [key: string]: unknown;
}

export interface TruckListResponseData {
  users: TruckUser[];
}

export interface TruckPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TruckListApiResponse {
  success: boolean;
  message?: string;
  data: TruckListResponseData;
  pagination?: TruckPaginationMeta;
}

export interface GetTrucksParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface TruckPayload {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  status?: string;
  truckInfo?: TruckInfo;
  [key: string]: unknown;
}

/**
 * Fetch Trucks list via GET /user/role/truck?page=1&limit=10&search=test
 */
export async function getTrucks(params: GetTrucksParams = {}): Promise<TruckListApiResponse> {
  const { page = 1, limit = 10, search = "" } = params;

  const queryParams: Record<string, string | number> = {
    page,
    limit,
  };
  if (search) {
    queryParams.search = search;
  }

  const response = await request<TruckListApiResponse>("/user/role/truck", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

/**
 * Create Truck via POST /user/truck
 */
export async function createTruck(
  payload: TruckPayload
): Promise<{ success: boolean; message?: string; data?: TruckUser }> {
  return await request<{ success: boolean; message?: string; data?: TruckUser }>("/user/truck", {
    method: "POST",
    body: payload,
  });
}

/**
 * Update Truck via PUT /user/truck/:id
 */
export async function updateTruck(
  userId: string,
  payload: TruckPayload
): Promise<{ success: boolean; message?: string; data?: TruckUser }> {
  return await request<{ success: boolean; message?: string; data?: TruckUser }>(
    `/user/truck/${userId}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}
