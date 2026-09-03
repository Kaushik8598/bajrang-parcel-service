import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDrivers,
  getTruckDropdownList,
  createDriver,
  updateDriver,
  GetDriversParams,
  DriverPayload,
} from "@/lib/api/driver";
import { USER_SINGLE_QUERY_KEY } from "./useUserById";

export const DRIVERS_QUERY_KEY = ["drivers-list"] as const;
export const TRUCKS_DROPDOWN_QUERY_KEY = ["trucks-dropdown-list"] as const;

/**
 * Custom React Query hook to fetch and manage driver list
 */
export function useDrivers(params: GetDriversParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: [...DRIVERS_QUERY_KEY, page, limit, search],
    queryFn: () => getDrivers({ page, limit, search }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Custom React Query hook to fetch truck list for dropdown
 */
export function useTruckDropdownList() {
  return useQuery({
    queryKey: TRUCKS_DROPDOWN_QUERY_KEY,
    queryFn: getTruckDropdownList,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Custom React Query mutation hook to create a new driver via POST /user/driver
 */
export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DriverPayload) => createDriver(payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRIVERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["drivers-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["trucks-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["trucks-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-truck-dropdown-list"] });
    },
  });
}

/**
 * Custom React Query mutation hook to update a driver via PUT /user/driver/:id
 */
export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: DriverPayload }) =>
      updateDriver(userId, payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: USER_SINGLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRIVERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["drivers-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["trucks-dropdown-list"] });
      queryClient.invalidateQueries({ queryKey: ["trucks-list"] });
      queryClient.invalidateQueries({ queryKey: ["only-truck-dropdown-list"] });
    },
  });
}
