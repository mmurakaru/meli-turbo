'use client';

import { Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles, UserCog } from 'lucide-react';

import { User } from '@/lib/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavUser({ user }: { user: User | null }) {
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="sm"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground place-items-center"
            >
              <Avatar className="size-6">
                <AvatarImage alt={user?.name || user?.email} />
                <AvatarFallback className="bg-violet-500 text-white">
                  <span className="text-xs font-medium">
                    {user?.email
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                </AvatarFallback>
              </Avatar>

              <span className="text-sm font-medium truncate">{user?.email.split('@')[0]}</span>
              <ChevronsUpDown
                strokeWidth={1}
                className="ml-auto size-4"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg gap-2"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="size-6">
                  <AvatarImage alt={user?.name || user?.email} />
                  <AvatarFallback className="bg-violet-500 text-white">
                    {user?.email
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{user?.email.split('@')[0]}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles strokeWidth={1} />
                Upgrade to Plus
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="grid gap-1">
              <Link
                href="/dashboard/account"
                passHref
              >
                <SidebarMenuButton
                  className={cn({ 'bg-gray-100': pathname === '/dashboard/account' })}
                  onClick={isMobile ? toggleSidebar : undefined}
                >
                  <UserCog strokeWidth={1} />
                  Account settings
                </SidebarMenuButton>
              </Link>

              <DropdownMenuItem>
                <CreditCard strokeWidth={1} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell strokeWidth={1} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut strokeWidth={1} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
