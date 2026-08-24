import { request } from "./client";
import type { DashboardStats } from "../types/common";
import type { ApiResponse } from "../types/common";

/**
 * GET /dashboard/stats
 * Returns all dashboard stat counts
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await request<ApiResponse<DashboardStats>>("/dashboard/stats");
  return response.data;
}

// ─── Static mock data for development (replace with real API calls) ──────────

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  today_booking: 27,
  today_delivered: 0,
  pending_parcel_delivery: 214773,
  today_parcel: 37,
  pending_payment: 7619672,
  total_branch: 29,
  branch_users: 38,
  total_customers: 38370,
  total_services: 10,
  cancel_booking: 0,
  pending_memo: 164,
};
