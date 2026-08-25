import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStaffList,
  createStaff,
  updateStaff,
  GetStaffParams,
  StaffPayload,
} from "@/lib/api/staff";
import { USER_SINGLE_QUERY_KEY } from "./useUserById";

export const STAFF_QUERY_KEY = ["staff-list"] as const;

/**
 * Custom React Query hook to fetch and manage staff list
 */
export function useStaffList(params: GetStaffParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: [...STAFF_QUERY_KEY, page, limit, search],
    queryFn: () => getStaffList({ page, limit, search }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Custom React Query mutation hook to create a new staff via POST /user/staff
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StaffPayload) => createStaff(payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
  });
}

/**
 * Custom React Query mutation hook to update staff via PUT /user/staff/:id
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: StaffPayload }) =>
      updateStaff(userId, payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
  });
}
