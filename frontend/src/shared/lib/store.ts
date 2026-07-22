import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isMobileSidebarOpen: false,
      theme: 'system',
      sidebarWidth: 280,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(240, Math.min(400, width)) }),
    }),
    {
      name: 'skilltree-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
      }),
    }
  )
);