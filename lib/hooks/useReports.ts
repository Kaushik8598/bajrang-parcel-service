import { useQuery } from "@tanstack/react-query";
import {
  getAllBookingReports,
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
