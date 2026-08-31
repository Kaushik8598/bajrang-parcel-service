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
  userId?: string;
  branchId: string;
  expenseType: ExpenseType | string;
  expenseDate?: string;
  date?: string;
  description?: string;
  remark?: string;
  documentUrl?: string;
  documentName?: string;
  cashAmount: number;
  onlineAmount: number;
  totalAmount: number;
  onlineScreenshot?: string;
  receiptUrl?: string;
  receiptName?: string;
  fuelType?: string;
  liter?: number;
  quantity?: number;
  startKM?: number;
  endKM?: number;
  speedometerKM?: number;
  truckId?: string;
  truckExpenseType?: string;
  labourMonth?: string;
  labourWeek?: string;
  labourCount?: number;
  ratePerLabour?: number;
  labourTotal?: number;
  [key: string]: unknown;
}

export interface ExpenseItem {
  _id: string;
  branchId?: string;
  userId?: string;
  branch?: {
    _id?: string;
    branchName?: string;
    branchCode?: string;
    [key: string]: unknown;
  };
  expenseType: ExpenseType | string;
  expenseDate?: string;
  date?: string;
  description?: string;
  remark?: string;
  documentUrl?: string;
  cashAmount: number;
  onlineAmount: number;
  totalAmount: number;
  onlineScreenshot?: string;
  receiptUrl?: string;
  fuelType?: string;
  liter?: number;
  startKM?: number;
  endKM?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ExpenseApiResponse {
  success: boolean;
  message?: string;
  data?: ExpenseItem | ExpenseItem[] | any;
}

export interface MemoHistoryParams {
  branchId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Create a new expense record via POST /memo/add-expense
 */
export async function createExpense(payload: ExpensePayload): Promise<ExpenseApiResponse> {
  return await request<ExpenseApiResponse>("/memo/add-expense", {
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

/**
 * Get fuel history via GET /memo/fuel-history
 */
export async function getFuelHistory(params?: MemoHistoryParams): Promise<any> {
  return await request<any>("/memo/fuel-history", {
    method: "GET",
    params,
  });
}

/**
 * Get rent history via GET /memo/rent-history
 */
export async function getRentHistory(params?: MemoHistoryParams): Promise<any> {
  return await request<any>("/memo/rent-history", {
    method: "GET",
    params,
  });
}

/**
 * Get salary history via GET /memo/salary-history
 */
export async function getSalaryHistory(params?: MemoHistoryParams): Promise<any> {
  return await request<any>("/memo/salary-history", {
    method: "GET",
    params,
  });
}

/**
 * Get labour history via GET /memo/labour-history
 */
export async function getLabourHistory(params?: MemoHistoryParams): Promise<any> {
  return await request<any>("/memo/labour-history", {
    method: "GET",
    params,
  });
}

/**
 * Get EMI history via GET /memo/emi-history
 */
export async function getEmiHistory(params?: MemoHistoryParams): Promise<any> {
  return await request<any>("/memo/emi-history", {
    method: "GET",
    params,
  });
}

