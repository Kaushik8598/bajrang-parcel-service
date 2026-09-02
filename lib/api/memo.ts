import { request } from "./client";

export interface CreateMemoPayload {
  sendToUserId: string;
  cashAmount: number;
  onlineAmount: number;
  proofUrl?: string;
  remark?: string;
  branchId?: string;
  [key: string]: unknown;
}

export interface MemoRecordItem {
  _id: string;
  memoNo?: string;
  totalAmountToSend: number;
  sendToUser?: {
    _id?: string;
    name?: string;
    role?: string;
    [key: string]: unknown;
  };
  fromBranch?: {
    _id?: string;
    branchName?: string;
    branchCode?: string;
  };
  cashAmount: number;
  onlineAmount: number;
  proofUrl?: string;
  remark?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface MemoSummaryItem {
  count: number;
  totalAmount: number;
}

export interface BranchInfoData {
  compensationType?: string;
  bookingCommission?: number;
  deliveryCommission?: number;
  [key: string]: unknown;
}

export interface PaymentSummaryItem {
  paymentMethod: string;
  count: number;
  totalAmount: number;
}

export interface SummaryTotalsSenderReceiver {
  totalAmount: number;
  collected: number;
  commission: number;
}

export interface SummaryTotalsExpense {
  totalAmount: number;
  cashAmount: number;
  onlineAmount: number;
  count: number;
}

export interface SummaryTotalsOverall {
  totalAmount: number;
  collected: number;
  commission: number;
  amountToSend: number;
  balanceUpdate: number;
}

export interface SummaryTotals {
  sender?: SummaryTotalsSenderReceiver;
  receiver?: SummaryTotalsSenderReceiver;
  expense?: SummaryTotalsExpense;
  overall?: SummaryTotalsOverall;
}

export interface MemoDataSummary {
  sender?: PaymentSummaryItem[];
  receiver?: PaymentSummaryItem[];
  totals?: SummaryTotals;
}

export interface MemoBookingOrExpenseItem {
  id?: string;
  _id?: string;
  docketNo1?: string;
  docketNo2?: string;
  memoNo?: string;
  type?: "sender" | "receiver" | "expense" | string;
  fromBranch?: {
    name?: string;
    code?: string;
  };
  toBranch?: {
    name?: string;
    code?: string;
  };
  paymentMethod?: string;
  amount?: number;
  cashAmount?: number;
  onlineAmount?: number;
  totalAmount?: number;
  status?: string;
  remark?: string;
  bookingDate?: string;
  bookingTime?: string;
  memoDate?: string;
  expenseType?: string;
  truckId?: string | null;
  truckName?: string;
  fuelType?: string;
  startKM?: number | null;
  endKM?: number | null;
  liter?: number | null;
  labourMonth?: string;
  labourWeek?: string;
  labourCount?: number | null;
  ratePerLabour?: number | null;
  labourTotal?: number | null;
  createdBy?: string;
  createdAt?: string;
  source?: string;
  [key: string]: unknown;
}

export interface DataForAddMemoResponse {
  success: boolean;
  message?: string;
  data: {
    branchInfo?: BranchInfoData;
    bookings?: MemoBookingOrExpenseItem[];
    expenses?: MemoBookingOrExpenseItem[];
    summary?: MemoDataSummary;
    // Fallback/legacy compatibility keys
    branch?: {
      compensationType?: string;
      Bookingcommission?: number;
      DeliveryCommission?: number;
    };
    totalSummary?: {
      totalBookingAmount?: number;
      totalDeliveryAmount?: number;
      totalAmount?: number;
      totalExpenseAmount?: number;
      bookingCommission?: number;
      deliveryCommission?: number;
      totalCommission?: number;
      amountToSend?: number;
    };
    memo?: any;
    [key: string]: unknown;
  };
  // Fallbacks if backend sends top-level keys
  branchInfo?: BranchInfoData;
  summary?: MemoDataSummary;
  totalSummary?: any;
}

export interface MemoApiResponse {
  success: boolean;
  message?: string;
  data?: MemoRecordItem | MemoRecordItem[] | any;
}

/**
 * Fetch memo data for creating new memo via GET /memo/dataForAddMemo
 */
export async function getDataForAddMemo(
  params?: { branchId?: string }
): Promise<DataForAddMemoResponse> {
  return await request<DataForAddMemoResponse>("/memo/dataForAddMemo", {
    method: "GET",
    params,
  });
}

/**
 * Create a new memo via POST /memo/add-memo
 */
export async function createMemo(payload: CreateMemoPayload): Promise<MemoApiResponse> {
  return await request<MemoApiResponse>("/memo/add-memo", {
    method: "POST",
    body: payload,
  });
}

/**
 * Get memo list via GET /memo
 */
export async function getMemoList(params?: Record<string, unknown>): Promise<MemoApiResponse> {
  return await request<MemoApiResponse>("/memo", {
    method: "GET",
    params,
  });
}

/**
 * Get memo by ID via GET /memo/:id
 */
export async function getMemoById(id: string): Promise<MemoApiResponse> {
  return await request<MemoApiResponse>(`/memo/${id}`, {
    method: "GET",
  });
}

/**
 * Get memo by memoNo via GET /memo/:memoNo
 */
export async function getMemoByMemoNo(memoNo: string): Promise<DataForAddMemoResponse> {
  return await request<DataForAddMemoResponse>(`/memo/${memoNo}`, {
    method: "GET",
  });
}

