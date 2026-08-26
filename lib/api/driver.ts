import { request } from "./client";

export interface PhotoDoc {
  image?: string;
}

export interface AadharCardDoc {
  number?: string;
  image?: string;
}

export interface PanCardDoc {
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

export interface DrivingLicenseDoc {
  number?: string;
  image?: string;
  expiryDate?: string;
  [key: string]: unknown;
}

export interface AssignedTruckItem {
  _id: string;
  name?: string;
  truckInfo?: {
    truckNumber?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DriverInfo {
  mobile2?: string;
  address?: string;
  city?: string;
  drivingLicense?: DrivingLicenseDoc;
  salary?: number;
  salaryType?: "monthly" | "weekly" | "daily" | "perTrip" | string;
  dailyBonus?: number;
  assignedTruckId?: string | AssignedTruckItem;
  [key: string]: unknown;
}

export interface DriverBookingPreferences {
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

export interface DriverUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: "active" | "inactive" | string;
  profilePhoto?: string | PhotoDoc;
  passportSizePhoto?: string | PhotoDoc;
  aadharCard?: AadharCardDoc;
  panCard?: PanCardDoc;
  bankDetails?: BankDetailsDoc;
  driverInfo?: DriverInfo;
  bookingPreferences?: DriverBookingPreferences;
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
  profilePhoto?: PhotoDoc;
  passportSizePhoto?: PhotoDoc;
  aadharCard?: AadharCardDoc;
  panCard?: PanCardDoc;
  bankDetails?: BankDetailsDoc;
  driverInfo?: DriverInfo;
  bookingPreferences?: DriverBookingPreferences;
  [key: string]: unknown;
}

export interface TruckDropdownItem {
  _id: string;
  name?: string;
  truckInfo?: {
    truckNumber?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TruckDropdownApiResponse {
  success: boolean;
  message?: string;
  data: {
    users?: TruckDropdownItem[];
    [key: string]: unknown;
  } | TruckDropdownItem[];
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
 * Fetch Truck list for dropdown via GET /user/role/truck?page=1&limit=100
 */
export async function getTruckDropdownList(): Promise<TruckDropdownApiResponse> {
  return await request<TruckDropdownApiResponse>("/user/role/truck", {
    method: "GET",
    params: { page: 1, limit: 100 },
  });
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
