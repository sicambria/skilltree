import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: (failureCount, error) => {
          if (error instanceof Response && error.status === 401) return false;
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}