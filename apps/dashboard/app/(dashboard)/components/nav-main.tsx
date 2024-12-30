'use client';

import { Copy, Folder, MoreHorizontal, Trash2, type LucideIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import Link from 'next/link';

export function NavMain({
  main,
}: {
  main: {
    name: string;
    href: string;
    icon: LucideIcon;
  }[];
}) {
  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {main.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              onClick={isMobile ? toggleSidebar : undefined}
            >
              <Link href={item.href}>
                <item.icon strokeWidth={1} />
                <span className="font-light">{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="hidden"
                >
                  <MoreHorizontal strokeWidth={1} />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-md"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <Folder
                    strokeWidth={1}
                    className="text-muted-foreground"
                  />
                  <span className="font-light">View Tours</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy
                    strokeWidth={1}
                    className="text-muted-foreground"
                  />
                  <span className="font-light">Copy link</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2
                    strokeWidth={1}
                    className="text-muted-foreground"
                  />
                  <span className="font-light">Delete tours</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
