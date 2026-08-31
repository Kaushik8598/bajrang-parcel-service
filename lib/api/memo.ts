import { request } from "./client";

export interface CreateMemoPayload {
  totalAmountToSend: number;
  sendToUserId: string;
  sendToUserName?: string;
  cashAmount: number;
  onlineAmount: number;
  proofUrl?: string;
  proofName?: string;
  remark?: string;
  bookingTotal?: number;
  deliveryTotal?: number;
  totalCommission?: number;
  actualCollected?: number;
  totalExpenses?: number;
  dockets?: Array<{
    docketNo: string;
    type: "BOOKING" | "DELIVERY";
    amount: number;
    paymentMethod?: string;
    date?: string;
  }>;
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

export interface MemoApiResponse {
  success: boolean;
  message?: string;
  data?: MemoRecordItem | MemoRecordItem[] | any;
}

/**
 * Create a new memo via POST /memo
 */
export async function createMemo(payload: CreateMemoPayload): Promise<MemoApiResponse> {
  return await request<MemoApiResponse>("/memo", {
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
