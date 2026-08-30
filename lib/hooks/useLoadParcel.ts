import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOnlyTruckList } from "@/lib/api/truck";
import { getLoadableParcels, loadParcels, type LoadParcelPayload } from "@/lib/api/booking";

export const ONLY_TRUCK_DROPDOWN_QUERY_KEY = ["only-truck-dropdown-list"] as const;
export const LOADABLE_PARCELS_QUERY_KEY = ["loadable-parcels-list"] as const;

/**
 * Custom React Query hook to fetch only trucks list via GET /user/onlytruck
 */
export function useOnlyTruckList() {
  return useQuery({
    queryKey: ONLY_TRUCK_DROPDOWN_QUERY_KEY,
    queryFn: getOnlyTruckList,
    staleTime: 60 * 1000,
  });
}

/**
 * Custom React Query hook to fetch all loadable parcels via GET /booking/loadablParcel (no query params)
 */
export function useLoadableParcels(enabled: boolean = true) {
  return useQuery({
    queryKey: LOADABLE_PARCELS_QUERY_KEY,
    queryFn: () => getLoadableParcels(),
    enabled: Boolean(enabled),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Custom React Query mutation hook to load parcels into a truck via POST /booking/loadParcel
 */
export function useLoadParcelsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoadParcelPayload) => loadParcels(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOADABLE_PARCELS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ONLY_TRUCK_DROPDOWN_QUERY_KEY });
    },
  });
}

