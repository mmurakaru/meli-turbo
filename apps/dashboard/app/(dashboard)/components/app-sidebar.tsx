'use client';

import { BookOpen, Bot, ChartColumn, CircleUser, Clock, Settings, SquareTerminal, Users } from 'lucide-react';
import * as React from 'react';

import { NavDeveloper } from '@/app/(dashboard)/components/nav-developer';
import { useUser } from '@/lib/auth';
import { Separator } from '@workspace/ui/components/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

// This is sample data.
const data = {
  main: [
    {
      name: 'Recents',
      href: '/dashboard',
      icon: Clock,
    },
    {
      name: 'Team',
      href: '/dashboard/team',
      icon: Users,
    },
    {
      name: 'Private',
      href: '/dashboard/private',
      icon: CircleUser,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: ChartColumn,
    },
  ],
  developer: [
    {
      title: 'Documentation',
      href: '/dashboard/documentation',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          href: '/dashboard/documentation/introduction',
        },
        {
          title: 'Get Started',
          href: '/dashboard/documentation/get-started',
        },
        {
          title: 'Examples',
          href: '/dashboard/documentation/examples',
        },
        {
          title: 'Changelog',
          href: '/dashboard/documentation/changelog',
        },
      ],
    },
    {
      title: 'Playground',
      href: '/dashboard/playground',
      icon: SquareTerminal,
      items: [
        {
          title: 'React',
          href: '/dashboard/playground/react',
        },
        {
          title: 'Angular',
          href: '/dashboard/playground/angular',
        },
      ],
    },
    {
      title: 'Voice AI',
      href: '/dashboard/voice-ai',
      icon: Bot,
      items: null,
    },
  ],
  settings: [{ href: '/dashboard/workspace', icon: Settings, label: 'Workspace Settings', id: null }],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  if (!user) return;

  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <NavMain main={data.main} />
        <NavDeveloper items={data.developer} />
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        {data.settings.map((item) => (
          <Link
            id={item.id ?? undefined}
            key={item.href}
            href={item.href}
            passHref
          >
            <SidebarMenuButton
              className={cn('data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground', {
                'bg-gray-100': pathname === item.href,
              })}
              onClick={isMobile ? toggleSidebar : undefined}
            >
              <item.icon
                strokeWidth={1}
                className="h-4 w-4"
              />
              <span className="font-light">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        ))}
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
