import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpense,
  getExpenseList,
  getExpenseById,
  getFuelHistory,
  getRentHistory,
  getSalaryHistory,
  getLabourHistory,
  getEmiHistory,
  ExpensePayload,
} from "@/lib/api/expense";

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
      queryClient.invalidateQueries({ queryKey: ["fuel-history"] });
      queryClient.invalidateQueries({ queryKey: ["rent-history"] });
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      queryClient.invalidateQueries({ queryKey: ["labour-history"] });
      queryClient.invalidateQueries({ queryKey: ["emi-history"] });
      queryClient.invalidateQueries({ queryKey: ["user-balance"] });
    },
  });
}

export function useFuelHistory(branchId?: string) {
  return useQuery({
    queryKey: ["fuel-history", branchId],
    queryFn: () => getFuelHistory(branchId ? { branchId } : undefined),
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
}

export function useRentHistory(branchId?: string) {
  return useQuery({
    queryKey: ["rent-history", branchId],
    queryFn: () => getRentHistory(branchId ? { branchId } : undefined),
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
}

export function useSalaryHistory(branchId?: string) {
  return useQuery({
    queryKey: ["salary-history", branchId],
    queryFn: () => getSalaryHistory(branchId ? { branchId } : undefined),
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
}

export function useLabourHistory(branchId?: string) {
  return useQuery({
    queryKey: ["labour-history", branchId],
    queryFn: () => getLabourHistory(branchId ? { branchId } : undefined),
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
}

export function useEmiHistory(branchId?: string) {
  return useQuery({
    queryKey: ["emi-history", branchId],
    queryFn: () => getEmiHistory(branchId ? { branchId } : undefined),
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
}
