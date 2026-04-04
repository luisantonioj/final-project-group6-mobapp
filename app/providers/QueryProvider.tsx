import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,   // 5 min — good default for candidates, positions
      gcTime:               1000 * 60 * 10,  // 10 min cache retention
      retry:                2,
      refetchOnWindowFocus: false,            // mobile: don't refetch on app foreground
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}