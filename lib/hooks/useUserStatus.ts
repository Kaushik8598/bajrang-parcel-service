import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { updateUserStatus, UserStatusType } from "@/lib/api/user";

export { updateUserStatus, type UserStatusType };

/**
 * Universal React Query mutation hook for status toggle and user deletion across all modules:
 * (Admin, Branch, Branch User, Customer, Driver, etc.)
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
      // Invalidate specific target query key if provided
      if (targetQueryKey) {
        queryClient.invalidateQueries({ queryKey: targetQueryKey });
      }

      // Invalidate all active master list queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          (query.queryKey[0].endsWith("-list") || query.queryKey[0].includes("list")),
      });
    },
  });
}
