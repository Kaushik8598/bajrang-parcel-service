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

export interface RentAgreementDoc {
  number?: string;
  image?: string;
}

export interface PhotoDoc {
  image?: string;
}

export interface CardDoc {
  number?: string;
  image?: string;
}

export interface BankDetailsDoc {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
  passbookImage?: string;
}

export interface BookingPreferences {
  draftOnlyBooking?: boolean;
  bookWithBill?: boolean;
  bookWithoutBill?: boolean;
  allowPaidBooking?: boolean;
  allowToPayBooking?: boolean;
  allowGPayBooking?: boolean;
  allowNotPayBooking?: boolean;
  allowCreditBooking?: boolean;
  creditLimit?: number;
  hamaliCost?: number;
  biltyCharge?: number;
  [key: string]: unknown;
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
  rentAgreement?: RentAgreementDoc;
  [key: string]: unknown;
}

export interface BranchPayload {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  status?: string;
  profilePhoto?: PhotoDoc;
  passportSizePhoto?: PhotoDoc;
  aadharCard?: CardDoc;
  panCard?: CardDoc;
  bankDetails?: BankDetailsDoc;
  bookingPreferences?: BookingPreferences;
  branchInfo: BranchInfo;
}

export interface BranchUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  status: "active" | "inactive" | string;
  profilePhoto?: PhotoDoc;
  passportSizePhoto?: PhotoDoc;
  aadharCard?: CardDoc;
  panCard?: CardDoc;
  bankDetails?: BankDetailsDoc;
  bookingPreferences?: BookingPreferences;
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

/**
 * Create Branch via POST /user/branch
 */
export async function createBranch(
  payload: BranchPayload
): Promise<{ success: boolean; message?: string; data?: BranchUser }> {
  return await request<{ success: boolean; message?: string; data?: BranchUser }>("/user/branch", {
    method: "POST",
    body: payload,
  });
}

/**
 * Update Branch via PUT /user/branch/:id
 */
export async function updateBranch(
  userId: string,
  payload: BranchPayload
): Promise<{ success: boolean; message?: string; data?: BranchUser }> {
  return await request<{ success: boolean; message?: string; data?: BranchUser }>(
    `/user/branch/${userId}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}

export interface BranchDropdownItem {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  branchInfo?: {
    branchName?: string;
    branchCode?: string;
    city?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface BranchDropdownApiResponse {
  success: boolean;
  message?: string;
  data:
  | {
    branches?: BranchDropdownItem[];
    users?: BranchDropdownItem[];
    [key: string]: unknown;
  }
  | BranchDropdownItem[];
}

/**
 * Fetch list of branches for dropdown select via GET /user/branchAndAdminList
 */
export async function getBranchDropdownList(): Promise<BranchDropdownApiResponse> {
  return await request<BranchDropdownApiResponse>("/user/branchAndAdminList", {
    method: "GET",
  });
}

