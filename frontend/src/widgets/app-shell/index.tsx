'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/shared/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={cn('flex-1 overflow-auto p-6', 'focus-visible:outline-none')}>
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}