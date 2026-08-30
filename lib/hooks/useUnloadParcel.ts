import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUnloadableTrucks,
  unloadParcels,
  type UnloadParcelPayload,
} from "@/lib/api/unloadParcel";
import {
  LOADABLE_PARCELS_QUERY_KEY,
  ONLY_TRUCK_DROPDOWN_QUERY_KEY,
} from "./useLoadParcel";

export const UNLOADABLE_TRUCKS_QUERY_KEY = ["UNLOADABLE_TRUCKS"];

export function useUnloadableTrucks() {
  return useQuery({
    queryKey: UNLOADABLE_TRUCKS_QUERY_KEY,
    queryFn: () => getUnloadableTrucks(),
    staleTime: 30 * 1000,
  });
}

export function useUnloadParcelsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UnloadParcelPayload) => unloadParcels(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNLOADABLE_TRUCKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOADABLE_PARCELS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ONLY_TRUCK_DROPDOWN_QUERY_KEY });
    },
  });
}
