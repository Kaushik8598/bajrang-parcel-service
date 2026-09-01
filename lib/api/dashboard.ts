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
