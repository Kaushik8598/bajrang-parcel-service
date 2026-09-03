import { queryClient } from "@/lib/queryClient";

export const USER_BADGES_QUERY_KEY = ["user-badges"] as const;
export const USER_BALANCE_QUERY_KEY = ["user-balance"] as const;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Centralized, debounced invalidation function for user badges and user balance.
 * Debounces calls within 350ms so that multiple rapid actions or parallel mutations
 * do NOT trigger duplicate or redundant API calls.
 */
export function refreshBadgesAndBalance(delay = 350) {
  if (typeof window === "undefined") return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: USER_BADGES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: USER_BALANCE_QUERY_KEY });
  }, delay);
}
