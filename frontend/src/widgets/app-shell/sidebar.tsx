'use client';

import { ChevronLeft, ChevronRight, Settings, HelpCircle, X } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  TreePine,
  Users,
  Plus,
  BarChart,
  Target,
  Star,
  MessageSquare,
  UserCheck,
  FilePlus,
  GitBranch,
  BookOpenCheck,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { useUIStore } from '@/shared/lib/store';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';


const navigation = [
  {
    title: 'Discover',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Browse Skills', href: '/skills', icon: BookOpen },
      { name: 'Browse Trees', href: '/trees', icon: TreePine },
      { name: 'Global Graph', href: '/graph', icon: BarChart },
    ],
  },
  {
    title: 'My Growth',
    items: [
      { name: 'Learning Plan', href: '/plan', icon: Target },
      { name: 'My Skills', href: '/my-skills', icon: Star },
      { name: 'Progress', href: '/progress', icon: BarChart },
    ],
  },
  {
    title: 'Community',
    items: [
      { name: 'Feed', href: '/community', icon: MessageSquare },
      { name: 'Recommendations', href: '/recommendations', icon: UserCheck },
    ],
  },
  {
    title: 'Contribute',
    items: [
      { name: 'Create Skill', href: '/contribute/skill', icon: FilePlus },
      { name: 'Create Tree', href: '/contribute/tree', icon: TreePine },
      { name: 'Add Training', href: '/contribute/training', icon: BookOpenCheck },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, isMobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } = useUIStore();

  if (isMobileSidebarOpen) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
        <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border-strong lg:hidden">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border-strong">
              <span className="font-semibold">SkillTree</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-border-strong bg-background transition-all duration-200',
        isSidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn('flex h-16 items-center justify-between px-4 border-b border-border-strong', !isSidebarOpen && 'justify-center')}>
          {isSidebarOpen && <span className="font-semibold">SkillTree</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(!isSidebarOpen && 'mx-auto')}
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              {isSidebarOpen && (
                <h3 className="mb-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1" role="list">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-text-muted hover:bg-surface-hover hover:text-text',
                          !isSidebarOpen && 'justify-center'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                        title={isSidebarOpen ? undefined : item.name}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        {isSidebarOpen && <span className="truncate">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {isSidebarOpen && (
            <div className="mt-6 pt-6 border-t border-border-strong">
              <ul className="space-y-1" role="list">
                <li>
                  <Link
                    href="/settings"
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-text-muted hover:bg-surface-hover hover:text-text',
                      pathname === '/settings' && 'bg-primary text-primary-foreground'
                    )}
                    aria-current={pathname === '/settings' ? 'page' : undefined}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>Settings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-text-muted hover:bg-surface-hover hover:text-text',
                      pathname === '/help' && 'bg-primary text-primary-foreground'
                    )}
                    aria-current={pathname === '/help' ? 'page' : undefined}
                  >
                    <HelpCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>Help</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  const handleNavigate = (href: string) => {
    onNavigate();
  };

  return (
    <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
      {navigation.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="mb-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            {section.title}
          </h3>
          <ul className="space-y-1" role="list">
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-muted hover:bg-surface-hover hover:text-text'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-6 pt-6 border-t border-border-strong">
        <ul className="space-y-1" role="list">
          <li>
            <Link
              href="/settings"
              onClick={() => onNavigate()}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-text-muted hover:bg-surface-hover hover:text-text',
                pathname === '/settings' && 'bg-primary text-primary-foreground'
              )}
              aria-current={pathname === '/settings' ? 'page' : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </li>
          <li>
            <Link
              href="/help"
              onClick={() => onNavigate()}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-text-muted hover:bg-surface-hover hover:text-text',
                pathname === '/help' && 'bg-primary text-primary-foreground'
              )}
              aria-current={pathname === '/help' ? 'page' : undefined}
            >
              <HelpCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>Help</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}