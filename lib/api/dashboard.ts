import { request } from "./client";
import type { DashboardResponseData, ApiResponse } from "../types/common";

export interface DashboardParams {
  startDate?: string;
  endDate?: string;
}

/**
 * GET /user/dashboard
 * Returns dashboard summary and branch stats with optional date range filters
 */
export async function getDashboardStats(params?: DashboardParams): Promise<DashboardResponseData> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `/user/dashboard${queryString ? `?${queryString}` : ""}`;

  const response = await request<ApiResponse<DashboardResponseData>>(url);
  return response.data;
}

// ─── Default fallback mock data matching real API response ─────────────────────
export const MOCK_DASHBOARD_DATA: DashboardResponseData = {
  user: {
    id: "6a95a8964c306cbdc2d52500",
    name: "BRANCH1",
    role: "branch",
  },
  dateRange: {
    startDate: null,
    endDate: null,
  },
  summary: {
    totalBookings: 4,
    todayBookings: 4,
    totalDeliveries: 2,
    todayDeliveries: 2,
    totalCancelled: 1,
    pendingDeliveries: 1,
    pendingParcels: 1,
  },
  branchSummary: {
    branchId: "6a95a8964c306cbdc2d52500",
    branchName: "BRANCH 1",
    branchCode: "BR1",
    totalBookings: 6,
    delivered: 2,
    cancelled: 1,
    pending: 3,
  },
};
