import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTrucks,
  createTruck,
  updateTruck,
  GetTrucksParams,
  TruckPayload,
} from "@/lib/api/truck";
import { USER_SINGLE_QUERY_KEY } from "./useUserById";

export const TRUCKS_QUERY_KEY = ["trucks-list"] as const;

/**
 * Custom React Query hook to fetch and manage truck list
 */
export function useTrucks(params: GetTrucksParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: [...TRUCKS_QUERY_KEY, page, limit, search],
    queryFn: () => getTrucks({ page, limit, search }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Custom React Query mutation hook to create a new truck via POST /user/truck
 */
export function useCreateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TruckPayload) => createTruck(payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TRUCKS_QUERY_KEY });
    },
  });
}

/**
 * Custom React Query mutation hook to update a truck via PUT /user/truck/:id
 */
export function useUpdateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: TruckPayload }) =>
      updateTruck(userId, payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TRUCKS_QUERY_KEY });
    },
  });
}
