import { request } from "./client";

export interface PhotoDoc {
  image?: string;
}

export interface BankDetailsDoc {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
  passbookImage?: string;
}

export interface TruckDocItem {
  number?: string;
  image?: string;
  expiryDate?: string;
  [key: string]: unknown;
}

export interface WeightCertificateDoc {
  receiptNumber?: string;
  weight?: number;
  image?: string;
  [key: string]: unknown;
}

export interface TruckDocuments {
  rc?: TruckDocItem;
  puc?: TruckDocItem;
  insurance?: TruckDocItem;
  fitness?: TruckDocItem;
  permit?: TruckDocItem;
  roadTax?: TruckDocItem;
  weightCertificate?: WeightCertificateDoc;
  [key: string]: unknown;
}

export interface AadharDoc {
  number?: string;
  image?: string;
}

export interface PanDoc {
  number?: string;
  image?: string;
}

export interface OwnerDocuments {
  aadhar?: AadharDoc;
  pan?: PanDoc;
  [key: string]: unknown;
}

export interface TruckOwnerDetail {
  name?: string;
  mobile1?: string;
  mobile2?: string;
  documents?: OwnerDocuments;
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
  truckNumber?: string;
  truckImage?: string;
  driverId?: TruckDriver | string;
  documents?: TruckDocuments;
  ownerDetail?: TruckOwnerDetail;
  capacity?: number;
  emiAmount?: number;
  emiDueDate?: string;
  [key: string]: unknown;
}

export interface TruckBookingPreferences {
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

export interface TruckUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: "active" | "inactive" | string;
  profilePhoto?: string | PhotoDoc;
  passportSizePhoto?: string | PhotoDoc;
  bankDetails?: BankDetailsDoc;
  truckInfo?: TruckInfo;
  bookingPreferences?: TruckBookingPreferences;
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
  profilePhoto?: PhotoDoc;
  passportSizePhoto?: PhotoDoc;
  bankDetails?: BankDetailsDoc;
  truckInfo?: TruckInfo;
  bookingPreferences?: TruckBookingPreferences;
  [key: string]: unknown;
}

export interface DriverDropdownItem {
  _id: string;
  name?: string;
  mobile?: string;
  role?: string;
  driverInfo?: {
    mobile2?: string;
    city?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DriverDropdownApiResponse {
  success: boolean;
  message?: string;
  data: {
    users?: DriverDropdownItem[];
    [key: string]: unknown;
  } | DriverDropdownItem[];
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
 * Fetch Driver list for dropdown via GET /user/role/driver?page=1&limit=100
 */
export async function getDriverDropdownList(): Promise<DriverDropdownApiResponse> {
  return await request<DriverDropdownApiResponse>("/user/role/driver", {
    method: "GET",
    params: { page: 1, limit: 100 },
  });
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

export interface OnlyTruckItem {
  truckNumber: string;
  driverName?: string;
  [key: string]: unknown;
}

export interface OnlyTruckApiResponse {
  success: boolean;
  message?: string;
  data: OnlyTruckItem[];
}

/**
 * Fetch Only Truck list for dropdown via GET /user/onlytruck
 */
export async function getOnlyTruckList(): Promise<OnlyTruckApiResponse> {
  return await request<OnlyTruckApiResponse>("/user/onlytruck", {
    method: "GET",
  });
}
