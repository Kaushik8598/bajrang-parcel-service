import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBranches,
  createBranch,
  updateBranch,
  GetBranchesParams,
  BranchPayload,
} from "@/lib/api/branch";
import { USER_SINGLE_QUERY_KEY } from "./useUserById";

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
      // Clean single user cache without triggering background refetch
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
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
      // Clean single user cache without triggering background refetch
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY });
    },
  });
}

export const BRANCH_DROPDOWN_QUERY_KEY = ["branch-dropdown-list"] as const;

/**
 * Custom React Query hook to fetch branch list for dropdowns via GET /user/branchAndAdminList
 */
export function useBranchDropdownList() {
  return useQuery({
    queryKey: BRANCH_DROPDOWN_QUERY_KEY,
    queryFn: () => import("@/lib/api/branch").then((m) => m.getBranchDropdownList()),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}

