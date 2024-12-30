'use client';

import { Folder, Forward, MoreHorizontal, Trash2, type LucideIcon } from 'lucide-react';

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

export function NavWorkspace({
  projects,
}: {
  projects: {
    name: string;
    href: string;
    icon: LucideIcon;
  }[];
}) {
  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              onClick={isMobile ? toggleSidebar : undefined}
            >
              <a href={item.href}>
                <item.icon strokeWidth={1} />
                <span className="font-light">{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
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
                  <span className="font-light">View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward
                    strokeWidth={1}
                    className="text-muted-foreground"
                  />
                  <span className="font-light">Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2
                    strokeWidth={1}
                    className="text-muted-foreground"
                  />
                  <span className="font-light">Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
