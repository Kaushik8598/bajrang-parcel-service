import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  GetAdminsParams,
  AdminPayload,
} from "@/lib/api/admin";
import { USER_SINGLE_QUERY_KEY } from "./useUserById";

export const ADMINS_QUERY_KEY = ["admins-list"] as const;

/**
 * Custom React Query hook to fetch and manage admin users list
 */
export function useAdmins(params: GetAdminsParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: [...ADMINS_QUERY_KEY, page, limit, search],
    queryFn: () => getAdmins({ page, limit, search }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Custom React Query mutation hook to create a new admin via POST /user/admin
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminPayload) => createAdmin(payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMINS_QUERY_KEY });
    },
  });
}

/**
 * Custom React Query mutation hook to update an admin via PUT /user/admin
 */
export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminPayload }) =>
      updateAdmin(userId, payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMINS_QUERY_KEY });
    },
  });
}

export const ONLY_ADMIN_DROPDOWN_QUERY_KEY = ["only-admin-dropdown-list"] as const;

/**
 * Custom React Query hook to fetch ONLY admins for dropdown via GET /user/onlyAdmin
 */
export function useOnlyAdminList() {
  return useQuery({
    queryKey: ONLY_ADMIN_DROPDOWN_QUERY_KEY,
    queryFn: () => import("@/lib/api/admin").then((m) => m.getOnlyAdminList()),
  });
}
