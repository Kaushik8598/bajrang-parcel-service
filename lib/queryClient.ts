import { QueryClient, MutationCache } from "@tanstack/react-query";
import { refreshBadgesAndBalance } from "@/lib/refreshBadgesAndBalance";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      refreshBadgesAndBalance();
    },
  }),
});

