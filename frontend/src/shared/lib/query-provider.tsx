import { QueryClient, QueryClientProvider, QueryClientProviderProps } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { isServer } from '@/shared/lib/utils';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer()) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function HydrationWrapper({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}