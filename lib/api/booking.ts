import { request } from "./client";
import type { ApiResponse } from "../types/common";
import type { ParcelBookingRecord } from "../types/booking";

// ─── API Endpoints ────────────────────────────────────────────────────────────

/**
 * GET /bookings
 * Fetch all parcel bookings with optional filters
 */
export async function getBookings(filters?: {
  from_date?: string;
  to_date?: string;
  from_branch_id?: string;
  to_branch_id?: string;
}): Promise<ParcelBookingRecord[]> {
  try {
    const response = await request<ApiResponse<ParcelBookingRecord[]>>("/bookings", {
      params: filters,
    });
    return response.data || [];
  } catch {
    return [];
  }
}

/**
 * GET /booking/:id
 * Fetch single booking by id
 */
export async function getBookingById(id: number | string): Promise<ParcelBookingRecord | null> {
  try {
    const response = await request<{ success: boolean; data: ParcelBookingRecord }>(`/booking/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * POST /booking
 * Create a new parcel booking docket
 */
export async function createParcelBooking(
  data: any
): Promise<any> {
  const response = await request<any>("/booking", {
    method: "POST",
    body: data,
  });
  return response;
}

/**
 * PUT /booking/:id
 * Update an existing booking
 */
export async function updateParcelBooking(
  id: number | string,
  data: any
): Promise<any> {
  const response = await request<any>(`/booking/${id}`, {
    method: "PUT",
    body: data,
  });
  return response;
}

export interface CancelBookingBody {
  cancelReason?: string;
  cancelRemark?: string;
  [key: string]: unknown;
}

/**
 * POST /booking/:id/:status
 * Update booking status (e.g. status = 'cancelled')
 */
export async function updateBookingStatus(
  id: number | string,
  status: string = "cancelled",
  body?: CancelBookingBody
): Promise<{ success: boolean; message?: string; [key: string]: unknown }> {
  return await request<{ success: boolean; message?: string }>(`/booking/${id}/${status}`, {
    method: "POST",
    body,
  });
}

/**
 * DELETE /bookings/:id
 * Cancel / Delete booking
 */
export async function deleteParcelBooking(id: number | string): Promise<boolean> {
  try {
    await updateBookingStatus(id, "cancelled");
    return true;
  } catch {
    return true;
  }
}

export interface LastBookingDocketData {
  docketNo?: string;
  bookingDate?: string;
  bookingTime?: string;
}

/**
 * GET /booking/lastBookingDocket
 * Fetch last booked docket details
 */
export async function getLastBookedDocket(): Promise<LastBookingDocketData | null> {
  try {
    const response = await request<{
      success: boolean;
      data: LastBookingDocketData;
      message?: string;
    }>("/booking/lastBookingDocket");
    return response.data || null;
  } catch {
    return null;
  }
}

export interface LastItem {
  parcel?: number | string;
  qty?: number | string;
  quantity?: number | string;
  material?: string;
  packing?: string;
  priceType?: string;
  paymentType?: string | number;
  payment_type?: string | number;
  rate?: number | string;
  price?: number | string;
}

export interface CustomerSuggestion {
  mobile: string;
  name: string;
  gst?: string;
  address?: string;
  city?: string;
  pincode?: string;
  lastItems?: LastItem[];
  lastBookings?: any[];
}

export interface SenderCustomerSuggestionResponse {
  customers: CustomerSuggestion[];
  total: number;
  lastBookings?: any[];
}

export interface ReceiverCustomerSuggestionResponse {
  customers: CustomerSuggestion[];
  total: number;
}

/**
 * GET /booking/senderCxSuggetion
 * Fetch sender customer suggestions and last bookings
 */
export async function getSenderCustomerSuggestions(search?: string): Promise<SenderCustomerSuggestionResponse> {
  try {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await request<{
      success: boolean;
      data: {
        customers: CustomerSuggestion[];
        total: number;
        lastBookings?: any[];
      };
      message?: string;
    }>("/booking/senderCxSuggetion", {
      params,
    });
    return response.data || { customers: [], total: 0, lastBookings: [] };
  } catch {
    return { customers: [], total: 0, lastBookings: [] };
  }
}

/**
 * GET /booking/receiverCxSuggetion
 * Fetch receiver customer suggestions associated with sender
 */
export async function getReceiverCustomerSuggestions(
  senderMobile?: string,
  search?: string
): Promise<ReceiverCustomerSuggestionResponse> {
  try {
    const params: Record<string, string> = {};
    if (senderMobile && senderMobile.trim()) {
      params.senderMobile = senderMobile.trim();
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await request<{
      success: boolean;
      data: {
        customers: CustomerSuggestion[];
        total: number;
      };
      message?: string;
    }>("/booking/receiverCxSuggetion", {
      params,
    });
    return response.data || { customers: [], total: 0 };
  } catch {
    return { customers: [], total: 0 };
  }
}

export interface LoadableBookingItem {
  _id: string;
  docketNo1?: string;
  docketNo2?: string;
  fromBranch?: string;
  fromBranchCode?: string;
  toBranch?: string;
  toBranchCode?: string;
  parcelCount?: number;
  paymentMethod?: string;
  trackingStatus?: string;
  pieceDetails?: string[];
  [key: string]: any;
}

export interface BranchGroupItem {
  branchName: string;
  count: number;
  parcels?: number;
}

export interface LoadableParcelSummary {
  totalBookings?: number;
  totalParcels?: number;
}

export interface LoadableParcelData {
  bookings: LoadableBookingItem[];
  summary?: LoadableParcelSummary;
  senderBranchGroup: BranchGroupItem[];
  receiverBranchGroup: BranchGroupItem[];
}

export interface LoadableParcelApiResponse {
  success: boolean;
  message?: string;
  data: LoadableParcelData;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * GET /booking/loadablParcel
 * Fetch loadable parcels, sender branch group, and receiver branch group (without params)
 */
export async function getLoadableParcels(): Promise<LoadableParcelApiResponse> {
  return await request<LoadableParcelApiResponse>("/booking/loadablParcel", {
    method: "GET",
  });
}


