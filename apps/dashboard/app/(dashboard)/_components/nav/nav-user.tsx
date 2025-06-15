'use client';

import { ChevronsUpDown, LogOut, Settings, Sparkles, UserCog } from 'lucide-react';

import { signOut } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';
import { Team } from '@/lib/db/schema';
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
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTeam } from '../../actions';

export function NavUser() {
  const { user, setUser } = useUser();
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (user?.id) {
      const fetchTeam = async () => {
        try {
          const teamData = await getTeam(user.id);
          setTeam(teamData);
        } catch (error) {
          console.error('Error fetching team data:', error);
        }
      };
      fetchTeam();
    }
  }, [user]);

  async function handleSignOut() {
    setUser(null);
    await signOut();
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
                <AvatarFallback className="bg-violet-500">
                  <span className="text-white text-xs font-medium">
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
            className="min-w-56 rounded-lg gap-2"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <SidebarMenuButton
                asChild
                className={cn({ 'bg-gray-100': pathname === '/dashboard/workspace' })}
              >
                <Link href="/dashboard/workspace">
                  <Settings strokeWidth={1} />
                  <span className="font-light">Workspace settings</span>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuButton asChild>
                <Link href="/pricing">
                  <Sparkles
                    strokeWidth={1}
                    className="text-[#2d3af7]"
                  />
                  <span className="font-light text-gradient">Upgrade this workspace</span>
                </Link>
              </SidebarMenuButton>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-sidebar-foreground/70">Workspaces</DropdownMenuLabel>
            <DropdownMenuGroup>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="size-6">
                  <AvatarImage alt={user?.name || user?.email} />
                  <AvatarFallback className="bg-violet-500">
                    <span className="text-white text-xs font-medium">
                      {user?.email
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="font-medium truncate">{user?.email.split('@')[0]}</span>
                  <span className="text-sidebar-foreground/70 truncate">
                    {team?.planName ? `${team?.planName} plan` : 'Free plan'}
                  </span>
                </div>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-sidebar-foreground/70">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuGroup className="grid gap-1">
              <SidebarMenuButton
                className={cn({ 'bg-gray-100': pathname === '/dashboard/account' })}
                onClick={isMobile ? toggleSidebar : undefined}
                asChild
              >
                <Link href="/dashboard/account">
                  <UserCog strokeWidth={1} />
                  <span className="font-light">Account settings</span>
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
                  <span className="font-light">Sign out</span>
                </SidebarMenuButton>
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
