import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { updateUserStatus, UserStatusType } from "@/lib/api/user";

export { updateUserStatus, type UserStatusType };

/**
 * Universal React Query mutation hook for status toggle and user deletion across all modules:
 * (Admin, Branch, Staff, Customer, Driver, Truck, etc.)
 */
export function useUpdateUserStatus(targetQueryKey?: QueryKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: UserStatusType;
    }) => updateUserStatus(userId, status),
    onSuccess: () => {
      // Invalidate target query key if provided
      if (targetQueryKey) {
        queryClient.invalidateQueries({ queryKey: targetQueryKey });
      }

      // Remove single user cache
      queryClient.removeQueries({ queryKey: ["user-detail"] });

      // Invalidate all main lists so table data always refreshes
      queryClient.invalidateQueries({ queryKey: ["admins-list"] });
      queryClient.invalidateQueries({ queryKey: ["branches-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["trucks-list"] });
      queryClient.invalidateQueries({ queryKey: ["drivers-list"] });
      queryClient.invalidateQueries({ queryKey: ["all-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user-role-vise-list"] });

      // Invalidate dropdown queries
      queryClient.invalidateQueries({ queryKey: ["trucks-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-truck-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["drivers-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-driver-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["branch-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-branch-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-admin-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["UNLOADABLE_TRUCKS"] });
    },
  });
}
