import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdmins, updateUserStatus, GetAdminsParams } from "@/lib/api/admin";

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
 * Custom React Query mutation hook to update user status or delete user
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: "active" | "inactive" | "suspended";
    }) => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMINS_QUERY_KEY });
    },
  });
}
