import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllBookingReports,
  getParcelPendingReports,
  getParcelDeliveredReports,
  getCancelBookingReports,
  getCustomerDiscountReports,
  getPendingDeliveryReports,
  getCustomerBookingReports,
  getMemoReports,
  updateMemoStatus,
  getExpenseReports,
  GetBookingReportsParams,
  GetMemoReportsParams,
  GetExpenseReportsParams,
} from "@/lib/api/reports";

export const BOOKING_REPORTS_QUERY_KEY = ["booking-reports-list"] as const;

/**
 * React Query hook to fetch booking reports list via GET /report/all
 */
export function useBookingReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...BOOKING_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getAllBookingReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const PARCEL_PENDING_REPORTS_QUERY_KEY = ["parcel-pending-reports-list"] as const;

/**
 * React Query hook to fetch parcel pending reports list via GET /report/confirmed
 */
export function useParcelPendingReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...PARCEL_PENDING_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getParcelPendingReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const PARCEL_DELIVERED_REPORTS_QUERY_KEY = ["parcel-delivered-reports-list"] as const;

/**
 * React Query hook to fetch parcel delivery reports list via GET /report/delivered
 */
export function useParcelDeliveredReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...PARCEL_DELIVERED_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getParcelDeliveredReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const CANCEL_BOOKING_REPORTS_QUERY_KEY = ["cancel-booking-reports-list"] as const;

/**
 * React Query hook to fetch cancel booking reports list via GET /report/cancelled
 */
export function useCancelBookingReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...CANCEL_BOOKING_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getCancelBookingReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const CUSTOMER_DISCOUNT_REPORTS_QUERY_KEY = ["customer-discount-reports-list"] as const;

/**
 * React Query hook to fetch customer discount reports list via GET /report/discount
 */
export function useCustomerDiscountReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...CUSTOMER_DISCOUNT_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getCustomerDiscountReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const PENDING_DELIVERY_REPORTS_QUERY_KEY = ["pending-delivery-reports-list"] as const;

/**
 * React Query hook to fetch pending delivery reports list via GET /report/atDestination
 */
export function usePendingDeliveryReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...PENDING_DELIVERY_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getPendingDeliveryReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const CUSTOMER_BOOKING_REPORTS_QUERY_KEY = ["customer-booking-reports-list"] as const;

/**
 * React Query hook to fetch customer booking / draft reports list via GET /report/draft
 */
export function useCustomerBookingReports(params: GetBookingReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    fromBranchId = "",
    toBranchId = "",
    startDate = "",
    endDate = "",
    hasBill = "",
  } = params;

  return useQuery({
    queryKey: [
      ...CUSTOMER_BOOKING_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      startDate,
      endDate,
      hasBill,
    ],
    queryFn: () =>
      getCustomerBookingReports({
        page,
        limit,
        search,
        fromBranchId,
        toBranchId,
        startDate,
        endDate,
        hasBill,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const MEMO_REPORTS_QUERY_KEY = ["memo-reports-list"] as const;

/**
 * React Query hook to fetch memo reports list via GET /report/memo
 */
export function useMemoReports(params: GetMemoReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    startDate = "",
    endDate = "",
    branchId = "",
    status = "",
  } = params;

  return useQuery({
    queryKey: [
      ...MEMO_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      startDate,
      endDate,
      branchId,
      status,
    ],
    queryFn: () =>
      getMemoReports({
        page,
        limit,
        search,
        startDate,
        endDate,
        branchId,
        status,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/**
 * Mutation hook to approve or reject a memo
 */
export function useUpdateMemoStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
      remark,
    }: {
      id: string;
      status: "approved" | "rejected" | string;
      reason?: string;
      remark?: string;
    }) => updateMemoStatus(id, status, reason || remark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMO_REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["memo-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export const EXPENSE_REPORTS_QUERY_KEY = ["expense-reports-list"] as const;

/**
 * React Query hook to fetch expense reports list via GET /report/expense
 */
export function useExpenseReports(params: GetExpenseReportsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    startDate = "",
    endDate = "",
    branchId = "",
    expenseType = "",
  } = params;

  return useQuery({
    queryKey: [
      ...EXPENSE_REPORTS_QUERY_KEY,
      page,
      limit,
      search,
      startDate,
      endDate,
      branchId,
      expenseType,
    ],
    queryFn: () =>
      getExpenseReports({
        page,
        limit,
        search,
        startDate,
        endDate,
        branchId,
        expenseType,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}







