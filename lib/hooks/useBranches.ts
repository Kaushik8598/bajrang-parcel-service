import { useQuery } from "@tanstack/react-query";
import { getBranches, GetBranchesParams } from "@/lib/api/branch";

export const BRANCHES_QUERY_KEY = ["branches-list"] as const;

/**
 * Custom React Query hook to fetch and manage branch list
 */
export function useBranches(params: GetBranchesParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: [...BRANCHES_QUERY_KEY, page, limit, search],
    queryFn: () => getBranches({ page, limit, search }),
    placeholderData: (previousData) => previousData,
  });
}
