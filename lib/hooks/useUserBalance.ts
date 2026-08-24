import { useQuery } from "@tanstack/react-query";
import { getUserBalance } from "@/lib/api/auth";

export const USER_BALANCE_QUERY_KEY = ["user-balance"] as const;

/**
 * Reusable React Query hook to get live user balance.
 * Returns balance data if present, otherwise strictly 0.
 */
export function useUserBalance() {
  const query = useQuery({
    queryKey: USER_BALANCE_QUERY_KEY,
    queryFn: getUserBalance,
  });

  return {
    balance: typeof query.data === "number" ? query.data : 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

