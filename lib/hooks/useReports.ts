import { useQuery } from "@tanstack/react-query";
import {
  getAllBookingReports,
  getParcelPendingReports,
  getParcelDeliveredReports,
  getCancelBookingReports,
  getCustomerDiscountReports,
  getPendingDeliveryReports,
  getCustomerBookingReports,
  GetBookingReportsParams,
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
  });
}





