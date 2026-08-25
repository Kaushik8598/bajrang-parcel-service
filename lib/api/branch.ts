import { request } from "./client";

export interface OwnerDetail {
  name?: string;
  mobile1?: string;
  mobile2?: string;
}

export interface AttendanceLocation {
  type?: "current" | "manual";
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  distance?: number | string;
}

export interface DocumentItem {
  number?: string;
  fileName?: string;
  fileUrl?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolder?: string;
  [key: string]: unknown;
}

export interface BranchDocuments {
  rentAgreement?: DocumentItem;
  aadharCard?: DocumentItem;
  panCard?: DocumentItem;
  bankDetails?: DocumentItem;
  passportPhoto?: DocumentItem;
  profilePhoto?: DocumentItem;
}

export interface BranchInfo {
  branchType?: "company" | "commission";
  branchName?: string;
  branchCode?: string;
  mobile1?: string;
  mobile2?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  branchMapLink?: string;
  allowPublicBooking?: boolean;
  compensationType?: "salary" | "commission";
  salaryAmount?: number;
  Bookingcommission?: number;
  DeliveryCommission?: number;
  commissionTarget?: number;
  deposite?: number;
  monthlyRent?: number;
  rentDueDate?: string;
  ownerDetail?: OwnerDetail;
  attendanceLocation?: AttendanceLocation;
  documents?: BranchDocuments;
  [key: string]: unknown;
}

export interface BranchUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  status: "active" | "inactive" | string;
  branchInfo?: BranchInfo;
  [key: string]: unknown;
}

export interface BranchListResponseData {
  users: BranchUser[];
}

export interface BranchPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BranchListApiResponse {
  success: boolean;
  message?: string;
  data: BranchListResponseData;
  pagination?: BranchPaginationMeta;
}

export interface GetBranchesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BranchPayload {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  status?: string;
  branchInfo: BranchInfo;
}

/**
 * Fetch Branches list via GET /user/role/branch?page=1&limit=10&search=test
 */
export async function getBranches(params: GetBranchesParams = {}): Promise<BranchListApiResponse> {
  const { page = 1, limit = 10, search = "" } = params;

  const queryParams: Record<string, string | number> = {
    page,
    limit,
  };
  if (search) {
    queryParams.search = search;
  }

  const response = await request<BranchListApiResponse>("/user/role/branch", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

/**
 * Create Branch via POST /user/branch (or /user/role/branch)
 */
export async function createBranch(
  payload: BranchPayload
): Promise<{ success: boolean; message?: string; data?: BranchUser }> {
  try {
    return await request<{ success: boolean; message?: string; data?: BranchUser }>("/user/branch", {
      method: "POST",
      body: payload,
    });
  } catch {
    return await request<{ success: boolean; message?: string; data?: BranchUser }>("/user/role/branch", {
      method: "POST",
      body: payload,
    });
  }
}

/**
 * Update Branch via PUT /user/branch/:id or PUT /user/branch
 */
export async function updateBranch(
  userId: string,
  payload: BranchPayload
): Promise<{ success: boolean; message?: string; data?: BranchUser }> {
  try {
    return await request<{ success: boolean; message?: string; data?: BranchUser }>(
      `/user/branch/${userId}`,
      {
        method: "PUT",
        body: payload,
      }
    );
  } catch {
    return await request<{ success: boolean; message?: string; data?: BranchUser }>("/user/branch", {
      method: "PUT",
      body: { ...payload, _id: userId, id: userId },
    });
  }
}
