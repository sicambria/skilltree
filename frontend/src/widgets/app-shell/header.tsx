'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Home,
  BookOpen,
  TreePine,
  Users,
  Plus,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Sun,
  Moon,
  LayoutDashboard,
  Book,
  GitBranch,
  Target,
  MessageSquare,
  Search,
  Star,
  FilePlus,
  Database,
  GraduationCap,
  Shield,
  BookOpenCheck,
} from 'lucide-react';
import { useUIStore } from '@/shared/lib/store';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { navigation } from '@/shared/config/navigation';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isMobileSidebarOpen, toggleMobileSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-strong bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileSidebar}
          aria-label="Toggle menu"
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <nav className="flex flex-1 items-center gap-2 lg:gap-4" aria-label="Main navigation">
          {navigation.flatMap((group) =>
            group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                  <span className="hidden sm:inline">{item.title}</span>
                </Link>
              );
            })
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-90 scale-[0] transition-transform dark:rotate-0 dark:scale-100" />
            <Moon className="h-5 w-5 rotate-[-90deg] scale-100 transition-transform dark:rotate-0 dark:scale-[0]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar>
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex w-full">
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full">
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}