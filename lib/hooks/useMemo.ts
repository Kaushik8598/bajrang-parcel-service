import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMemo, getMemoList, getMemoById, CreateMemoPayload } from "@/lib/api/memo";

export const MEMO_LIST_QUERY_KEY = ["memo-list"] as const;

export function useMemoList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...MEMO_LIST_QUERY_KEY, params],
    queryFn: () => getMemoList(params),
  });
}

export function useMemoById(id?: string) {
  return useQuery({
    queryKey: ["memo-detail", id],
    queryFn: () => getMemoById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateMemoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMemoPayload) => createMemo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMO_LIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["user-balance"] });
    },
  });
}
