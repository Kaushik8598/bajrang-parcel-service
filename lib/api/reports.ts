import { request } from "./client";

export interface BranchRef {
  _id?: string;
  branchName?: string;
  branchCode?: string;
  city?: string;
  [key: string]: unknown;
}

export interface PartyRef {
  name?: string;
  mobile?: string;
  contact_no?: string;
  gstin?: string;
  address?: string;
  city?: string;
  [key: string]: unknown;
}

export interface BookingByIdRef {
  _id?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface TrackingStatusRef {
  confirmed?: number;
  delivered?: number;
  cancelled?: number;
  draft?: number;
  arrived_at_destination?: number;
  total?: number;
  [key: string]: unknown;
}

export interface DeliveryInfoRef {
  receiverName?: string;
  receiverMobile?: string;
  deliveredAt?: string;
  deliveryRemark?: string;
}

export interface ParcelBookingReportItem {
  _id: string;
  docketNo1?: string; // Docket No
  docketNo2?: string; // Tracking No
  fromBranch?: BranchRef;
  toBranch?: BranchRef;
  sender?: PartyRef;
  receiver?: PartyRef;
  parcel?: number; // Qty
  finalBillAmount?: number;
  paymentMethod?: "g pay" | "credit" | "paid" | "to-pay" | "not-pay" | string;
  discount?: number;
  hasBill?: boolean;
  billNo?: string;
  billImage?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingById?: BookingByIdRef;
  deliveryInfo?: DeliveryInfoRef;
  remark?: string;
  trackingStatus?: TrackingStatusRef;
  status?: string;
  cancelReason?: string;
  cancelRemark?: string;
  [key: string]: unknown;
}



export interface GetBookingReportsParams {
  page?: number;
  limit?: number;
  search?: string;
  fromBranchId?: string;
  toBranchId?: string;
  startDate?: string;
  endDate?: string;
  hasBill?: boolean | string;
}

export interface BookingReportsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BookingReportsApiResponse {
  success: boolean;
  message?: string;
  data:
  | {
    bookings?: ParcelBookingReportItem[];
    reports?: ParcelBookingReportItem[];
    items?: ParcelBookingReportItem[];
    data?: ParcelBookingReportItem[];
    [key: string]: unknown;
  }
  | ParcelBookingReportItem[];
  pagination?: BookingReportsPagination;
}

/**
 * Fetch all booking reports with pagination and filter support via GET /report/all
 */
export async function getAllBookingReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/all", {
    method: "GET",
    params: queryParams,
  });

  return response;
}

/**
 * Fetch parcel pending reports with pagination and filter support via GET /report/confirmed
 */
export async function getParcelPendingReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/confirmed", {
    method: "GET",
    params: queryParams,
  });
  return response;
}

/**
 * Fetch parcel delivery reports with pagination and filter support via GET /report/delivered
 */
export async function getParcelDeliveredReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/delivered", {
    method: "GET",
    params: queryParams,
  });
  return response;
}

/**
 * Fetch cancel booking reports with pagination and filter support via GET /report/cancelled
 */
export async function getCancelBookingReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/cancelled", {
    method: "GET",
    params: queryParams,
  });
  return response;
}

/**
 * Fetch customer discount reports with pagination and filter support via GET /report/discount
 */
export async function getCustomerDiscountReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/discount", {
    method: "GET",
    params: queryParams,
  });
  return response;
}

/**
 * Fetch pending delivery reports (atDestination) with pagination and filter support via GET /report/atDestination
 */
export async function getPendingDeliveryReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/atDestination", {
    method: "GET",
    params: queryParams,
  });
  return response;
}

/**
 * Fetch customer booking (draft) reports with pagination and filter support via GET /report/draft
 */
export async function getCustomerBookingReports(
  params: GetBookingReportsParams = {}
): Promise<BookingReportsApiResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId,
    toBranchId,
    startDate,
    endDate,
    hasBill,
  } = params;

  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) queryParams.search = search;
  if (fromBranchId) queryParams.fromBranchId = fromBranchId;
  if (toBranchId) queryParams.toBranchId = toBranchId;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (hasBill !== undefined && hasBill !== "") {
    queryParams.hasBill = hasBill === "true" || hasBill === true ? true : false;
  }

  const response = await request<BookingReportsApiResponse>("/report/draft", {
    method: "GET",
    params: queryParams,
  });
  return response;
}






