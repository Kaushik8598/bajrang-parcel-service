import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, getExpenseList, getExpenseById, ExpensePayload } from "@/lib/api/expense";

export const EXPENSE_QUERY_KEY = ["expense-list"];

export function useExpenseList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...EXPENSE_QUERY_KEY, params],
    queryFn: () => getExpenseList(params),
  });
}

export function useExpenseById(id?: string) {
  return useQuery({
    queryKey: ["expense-detail", id],
    queryFn: () => getExpenseById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpensePayload) => createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["user-balance"] });
    },
  });
}
