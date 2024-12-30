'use client';

import { Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles, UserCog } from 'lucide-react';

import { User } from '@/lib/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
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
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8">
                <AvatarImage alt={user?.name || user?.email} />
                <AvatarFallback className="bg-violet-500 text-white">
                  {user?.email
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
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
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
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
            <DropdownMenuGroup>
              <Link
                href="/dashboard/account"
                passHref
              >
                <Button
                  variant={pathname === '/dashboard/account' ? 'secondary' : 'ghost'}
                  className={`my-1 w-full justify-start ${pathname === '/dashboard/account' ? 'bg-gray-100' : ''}`}
                  onClick={isMobile ? toggleSidebar : undefined}
                >
                  <DropdownMenuItem>
                    <UserCog strokeWidth={1} />
                    Account settings
                  </DropdownMenuItem>
                </Button>
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
