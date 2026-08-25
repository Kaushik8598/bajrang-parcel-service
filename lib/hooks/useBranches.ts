import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBranches,
  createBranch,
  updateBranch,
  GetBranchesParams,
  BranchPayload,
} from "@/lib/api/branch";

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

/**
 * Custom React Query mutation hook to create a new branch
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BranchPayload) => createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY });
    },
  });
}

/**
 * Custom React Query mutation hook to update a branch
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: BranchPayload }) =>
      updateBranch(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY });
    },
  });
}
