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

export interface DataForAddMemoResponse {
  success: boolean;
  message?: string;
  data: {
    bookings: Array<{
      docketNo1?: string;
      docketNo2?: string;
      fromBranch?: {
        name?: string;
        code?: string;
      };
      toBranch?: {
        name?: string;
        code?: string;
      };
      finalBillAmount?: number;
      paymentMethod?: string;
      status?: string;
      bookingDate?: string;
      bookingTime?: string;
      isSenderMemoCreated?: boolean;
      isReceiverMemoCreated?: boolean;
      sender?: {
        name?: string;
      };
      receiver?: {
        name?: string;
      };
      [key: string]: unknown;
    }>;
    expenses: Array<{
      memoNo?: string;
      fromBranch?: {
        name?: string;
        code?: string;
      };
      toBranch?: {
        name?: string;
        code?: string;
      };
      totalAmount?: number;
      cashAmount?: number;
      onlineAmount?: number;
      memoDate?: string;
      remark?: string;
      expenseType?: string;
      status?: string;
      expenseDeducted?: boolean;
      expenseDeductedAmount?: number;
      expenseDeductedAt?: string;
      [key: string]: unknown;
    }>;
  };
  total?: {
    bookings?: number;
    expenses?: number;
  };
  bookingSummary?: {
    paid?: MemoSummaryItem;
    "to pay"?: MemoSummaryItem;
    "g pay"?: MemoSummaryItem;
    credit?: MemoSummaryItem;
    "not pay"?: MemoSummaryItem;
  };
  deliverySummary?: {
    paid?: MemoSummaryItem;
    "to pay"?: MemoSummaryItem;
    "g pay"?: MemoSummaryItem;
    credit?: MemoSummaryItem;
    "not pay"?: MemoSummaryItem;
  };
  expenseSummary?: {
    count?: number;
    totalAmount?: number;
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
    compensationType?: string;
    salaryAmount?: number;
  };
  branch?: {
    branchType?: string;
    compensationType?: string;
    salaryAmount?: number;
    Bookingcommission?: number;
    DeliveryCommission?: number;
  };
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

