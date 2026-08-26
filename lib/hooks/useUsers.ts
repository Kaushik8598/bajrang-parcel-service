import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  GetAllUsersParams,
  getUserPermissionsById,
  updateUserPermissionsById,
  UserPermissionItem,
} from "@/lib/api/user";

export const ALL_USERS_QUERY_KEY = ["all-users-list"] as const;

/**
 * React Query hook to fetch all users list via GET /user/allUser
 */
export function useAllUsers(params: GetAllUsersParams = {}) {
  const { page = 1, limit = 10, search = "", role = "", status = "" } = params;

  return useQuery({
    queryKey: [...ALL_USERS_QUERY_KEY, page, limit, search, role, status],
    queryFn: () =>
      getAllUsers({
        page,
        limit,
        search,
        role: role || undefined,
        status: status || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });
}

export const USER_PERMISSIONS_QUERY_KEY = ["user-permissions-detail"] as const;

/**
 * React Query hook to fetch specific user's permissions via GET /user/permission/:id
 */
export function useUserPermissionsById(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...USER_PERMISSIONS_QUERY_KEY, userId],
    queryFn: () => (userId ? getUserPermissionsById(userId) : null),
    enabled: Boolean(userId) && enabled,
  });
}

/**
 * React Query mutation hook to update user permissions via PUT /user/permission/:id
 */
export function useUpdateUserPermissionsById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: UserPermissionItem[];
    }) => updateUserPermissionsById(userId, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...USER_PERMISSIONS_QUERY_KEY, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ALL_USERS_QUERY_KEY,
      });
    },
  });
}

