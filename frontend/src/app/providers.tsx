'use client';

import * as React from 'react';
import { QueryProvider } from '@/shared/lib/query-provider';
import { Toaster } from '@/shared/ui/toaster';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { UIProvider } from '@/shared/providers/ui-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <UIProvider>
          {children}
          <Toaster />
        </UIProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}