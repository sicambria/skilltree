'use client';

import {
  LayoutDashboard,
  BookOpen,
  TreePine,
  Users,
  Plus,
  Settings,
  HelpCircle,
  MessageSquare,
  Search,
  Star,
  FilePlus,
  Database,
  GraduationCap,
  Shield,
  BookOpenCheck,
  BarChart,
  Target,
  UserCheck,
  GitBranch,
} from 'lucide-react';
import React from 'react';

import { cn } from '@/shared/lib/utils';

export interface SidebarNavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
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
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Browse Skills', href: '/skills', icon: BookOpen },
      { title: 'Browse Trees', href: '/trees', icon: TreePine },
      { title: 'Global Graph', href: '/graph', icon: BarChart },
    ],
  },
  {
    title: 'My Growth',
    items: [
      { title: 'Learning Plan', href: '/plan', icon: Target },
      { title: 'My Skills', href: '/my-skills', icon: Star },
      { title: 'Progress', href: '/progress', icon: BarChart },
    ],
  },
  {
    title: 'Community',
    items: [
      { title: 'Feed', href: '/community', icon: MessageSquare },
      { title: 'Recommendations', href: '/recommendations', icon: UserCheck },
    ],
  },
  {
    title: 'Contribute',
    items: [
      { title: 'Create Skill', href: '/contribute/skill', icon: FilePlus },
      { title: 'Create Tree', href: '/contribute/tree', icon: TreePine },
      { title: 'Add Training', href: '/contribute/training', icon: BookOpenCheck },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Content', href: '/admin/content', icon: Database },
      { title: 'Seed Data', href: '/admin/seed', icon: Shield },
    ],
  },
  {
    title: 'Help',
    items: [
      { title: 'Getting Started', href: '/help/getting-started', icon: GraduationCap },
      { title: 'Documentation', href: '/help/docs', icon: BookOpen },
      { title: 'Support', href: '/help/support', icon: HelpCircle },
    ],
  },
];

export function useSidebar() {
  const [open, setOpen] = React.useState(true);
  return { open, setOpen, toggle: () => setOpen((o) => !o) };
}

export { navigation };