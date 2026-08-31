import { request } from "./client";

export type ExpenseType =
  | "Stationary"
  | "Petrol"
  | "Diesel"
  | "CNG"
  | "Other Truck"
  | "Rent"
  | "Salary"
  | "Labour"
  | "Truck EMI/Hapto";

export interface ExpensePayload {
  branchId: string;
  expenseType: ExpenseType | string;
  expenseDate: string;
  remark?: string;
  documentUrl?: string;
  documentName?: string;
  cashAmount: number;
  onlineAmount: number;
  totalAmount: number;
  receiptUrl?: string;
  receiptName?: string;
  [key: string]: unknown;
}

export interface ExpenseItem {
  _id: string;
  branchId?: string;
  branch?: {
    _id?: string;
    branchName?: string;
    branchCode?: string;
    [key: string]: unknown;
  };
  expenseType: ExpenseType | string;
  expenseDate: string;
  remark?: string;
  documentUrl?: string;
  cashAmount: number;
  onlineAmount: number;
  totalAmount: number;
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ExpenseApiResponse {
  success: boolean;
  message?: string;
  data?: ExpenseItem | ExpenseItem[];
}

/**
 * Create a new expense record via POST /expense
 */
export async function createExpense(payload: ExpensePayload): Promise<ExpenseApiResponse> {
  return await request<ExpenseApiResponse>("/expense", {
    method: "POST",
    body: payload,
  });
}

/**
 * Get expense list via GET /expense
 */
export async function getExpenseList(params?: Record<string, unknown>): Promise<ExpenseApiResponse> {
  return await request<ExpenseApiResponse>("/expense", {
    method: "GET",
    params,
  });
}

/**
 * Get expense by ID via GET /expense/:id
 */
export async function getExpenseById(id: string): Promise<ExpenseApiResponse> {
  return await request<ExpenseApiResponse>(`/expense/${id}`, {
    method: "GET",
  });
}
