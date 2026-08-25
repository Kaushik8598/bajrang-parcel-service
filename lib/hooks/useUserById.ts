import { useQuery } from "@tanstack/react-query";
import { getUserById, UserDetailApiResponse } from "@/lib/api/user";

export const USER_SINGLE_QUERY_KEY = ["user-single"] as const;

/**
 * React Query hook to fetch a single user by ID via GET /user/:id
 */
export function useUserById<T = unknown>(userId?: string | null, enabled: boolean = true) {
  return useQuery<UserDetailApiResponse<T>>({
    queryKey: [...USER_SINGLE_QUERY_KEY, userId],
    queryFn: () => getUserById<T>(userId!),
    enabled: Boolean(userId) && Boolean(enabled),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
