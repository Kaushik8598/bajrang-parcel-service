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
      // Invalidate target query key
      if (targetQueryKey) {
        queryClient.invalidateQueries({ queryKey: targetQueryKey });
      }
      queryClient.invalidateQueries({ queryKey: ["trucks-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-truck-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["drivers-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["branch-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-branch-dropdown-list"] });
    },
  });
}
