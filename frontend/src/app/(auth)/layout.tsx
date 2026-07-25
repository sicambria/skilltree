'use client';

import { Providers } from '@/app/providers';
import { QueryProvider } from '@/shared/lib/query-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <Providers>{children}</Providers>
    </QueryProvider>
  );
}