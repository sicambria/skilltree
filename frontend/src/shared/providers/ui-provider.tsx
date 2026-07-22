'use client';

import * as React from 'react';

import { useUIStore } from '@/shared/lib/store';

interface UIProviderProps {
  children: React.ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const { theme, setTheme } = useUIStore();

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const handleSystemChange = (e: MediaQueryListEvent) => {
    if (theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  };

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  return <>{children}</>;
}