import { request } from "./client";

export interface BranchInfo {
  branchName?: string;
  branchCode?: string;
  mobile1?: string;
  mobile2?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  [key: string]: unknown;
}

export interface BranchUser {
  _id: string;
  name: string;
  email: string;
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
