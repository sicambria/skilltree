'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface SidebarNavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }> | null;
  items?: SidebarNavItem[];
}

export interface SidebarNavGroup {
  title: string;
  items: SidebarNavItem[];
}

const navigation: SidebarNavGroup[] = [
  {
    title: 'Discover',
    items: [
      { title: 'Browse Skills', href: '/skills', icon: null },
      { title: 'Browse Trees', href: '/trees', icon: null },
      { title: 'Global Graph', href: '/graph', icon: null },
    ],
  },
  {
    title: 'My Growth',
    items: [
      { title: 'Dashboard', href: '/', icon: null },
      { title: 'My Skills', href: '/skills/me', icon: null },
      { title: 'Learning Plan', href: '/plan', icon: null },
      { title: 'Progress', href: '/progress', icon: null },
    ],
  },
  {
    title: 'Community',
    items: [
      { title: 'Feed', href: '/community', icon: null },
      { title: 'Recommendations', href: '/community/recommendations', icon: null },
      { title: 'People', href: '/community/people', icon: null },
    ],
  },
  {
    title: 'Contribute',
    items: [
      { title: 'Create Skill', href: '/create/skill', icon: null },
      { title: 'Create Tree', href: '/create/tree', icon: null },
      { title: 'Add Training', href: '/create/training', icon: null },
      { title: 'Wikidata Import', href: '/create/import', icon: null },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Users', href: '/admin/users', icon: null },
      { title: 'Content', href: '/admin/content', icon: null },
      { title: 'Seed Data', href: '/admin/seed', icon: null },
    ],
  },
  {
    title: 'Help',
    items: [
      { title: 'Getting Started', href: '/help/getting-started', icon: null },
      { title: 'Documentation', href: '/help/docs', icon: null },
      { title: 'Support', href: '/help/support', icon: null },
    ],
  },
];

export function useSidebar() {
  const [open, setOpen] = React.useState(true);
  return { open, setOpen, toggle: () => setOpen((o) => !o) };
}

export { navigation };