'use client';

import { ChevronsUpDown, LogOut, Sparkles, UserCog } from 'lucide-react';

import { signOut } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function NavUser() {
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  const { user, setUser } = useUser();
  const router = useRouter();

  async function handleSignOut() {
    setUser(null);
    await signOut();
    router.push('/');
  }

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
              <SidebarMenuButton asChild>
                <Link href="/pricing">
                  <Sparkles strokeWidth={1} />
                  Upgrade this workspace
                </Link>
              </SidebarMenuButton>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="grid gap-1">
              <SidebarMenuButton
                className={cn({ 'bg-gray-100': pathname === '/dashboard/account' })}
                onClick={isMobile ? toggleSidebar : undefined}
                asChild
              >
                <Link href="/dashboard/account">
                  <UserCog strokeWidth={1} />
                  Account settings
                </Link>
              </SidebarMenuButton>
              {/* <DropdownMenuItem>
                <CreditCard strokeWidth={1} />
                Billing
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <Bell strokeWidth={1} />
                Notifications
              </DropdownMenuItem> */}
              <form onSubmit={handleSignOut}>
                <SidebarMenuButton type="submit">
                  <LogOut strokeWidth={1} />
                  Sign out
                </SidebarMenuButton>
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
