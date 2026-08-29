import { useQuery } from "@tanstack/react-query";
import { getUserBalance, getStoredUser } from "@/lib/api/auth";

export const USER_BALANCE_QUERY_KEY = ["user-balance"] as const;

/**
 * Reusable React Query hook to get live user balance.
 * Seeding from logged-in user profile (from Login API response),
 * and updating with the latest balance as soon as /user/balance API resolves.
 */
export function useUserBalance() {
  const query = useQuery({
    queryKey: USER_BALANCE_QUERY_KEY,
    queryFn: getUserBalance,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    balance: typeof query.data === "number" ? query.data : 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
