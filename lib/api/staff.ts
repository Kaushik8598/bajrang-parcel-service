import { request } from "./client";

export interface StaffBranch {
  _id: string;
  name?: string;
  branchInfo?: {
    branchName?: string;
    branchCode?: string;
    city?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface StaffAttendanceLocation {
  latitude?: number | string;
  longitude?: number | string;
  distance?: number | string;
}

export interface StaffProfile {
  branchId?: StaffBranch | string;
  compensationType?: "none" | "salary" | "commission" | "both" | string;
  salaryAmount?: number;
  Bookingcommission?: number;
  DeliveryCommission?: number;
  attendanceLocation?: StaffAttendanceLocation;
  joiningDate?: string;
  [key: string]: unknown;
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

export interface StaffBookingPreferences {
  bookWithBill?: boolean;
  bookWithoutBill?: boolean;
  allowPaidBooking?: boolean;
  allowToPayBooking?: boolean;
  allowGPayBooking?: boolean;
  allowCreditBooking?: boolean;
  allowNotPayBooking?: boolean;
  draftOnlyBooking?: boolean;
  creditLimit?: number;
  hamaliCost?: number;
  biltyCharge?: number;
  [key: string]: unknown;
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: "active" | "inactive" | string;
  profilePhoto?: string | PhotoDoc;
  passportSizePhoto?: string | PhotoDoc;
  aadharCard?: CardDoc;
  panCard?: CardDoc;
  bankDetails?: BankDetailsDoc;
  staffProfile?: StaffProfile;
  bookingPreferences?: StaffBookingPreferences;
  [key: string]: unknown;
}

export interface StaffListResponseData {
  users: StaffUser[];
}

export interface StaffPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StaffListApiResponse {
  success: boolean;
  message?: string;
  data: StaffListResponseData;
  pagination?: StaffPaginationMeta;
}

export interface GetStaffParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface StaffPayload {
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
  staffProfile?: StaffProfile;
  bookingPreferences?: StaffBookingPreferences;
  [key: string]: unknown;
}

/**
 * Fetch Staff list via GET /user/role/staff?page=1&limit=10&search=test
 */
export async function getStaffList(params: GetStaffParams = {}): Promise<StaffListApiResponse> {
  const { page = 1, limit = 10, search = "" } = params;

  const queryParams: Record<string, string | number> = {
    page,
    limit,
  };
  if (search) {
    queryParams.search = search;
  }

  const response = await request<StaffListApiResponse>("/user/role/staff", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

/**
 * Create Staff via POST /user/staff
 */
export async function createStaff(
  payload: StaffPayload
): Promise<{ success: boolean; message?: string; data?: StaffUser }> {
  return await request<{ success: boolean; message?: string; data?: StaffUser }>("/user/staff", {
    method: "POST",
    body: payload,
  });
}

/**
 * Update Staff via PUT /user/staff/:id
 */
export async function updateStaff(
  userId: string,
  payload: StaffPayload
): Promise<{ success: boolean; message?: string; data?: StaffUser }> {
  return await request<{ success: boolean; message?: string; data?: StaffUser }>(
    `/user/staff/${userId}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}
