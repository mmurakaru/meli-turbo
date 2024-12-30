'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@workspace/ui/components/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavSettings({
  items,
}: {
  items: {
    title: string;
    href: string;
    icon?: LucideIcon;
    items?:
      | {
          title: string;
          href: string;
        }[]
      | null;
  }[];
}) {
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Developer</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            className="group/collapsible"
            defaultOpen={pathname === item.href}
          >
            <SidebarMenuItem>
              <Link
                href={item.href}
                passHref
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn({ 'bg-gray-100': pathname === item.href })}
                  >
                    {item.icon && <item.icon strokeWidth={1} />}
                    <span className="font-light">{item.title}</span>
                    <ChevronRight
                      strokeWidth={1}
                      className={cn(
                        'ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                        { hidden: !item.items?.length },
                      )}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </Link>

              <CollapsibleContent className={cn({ hidden: !item.items?.length })}>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        onClick={isMobile ? toggleSidebar : undefined}
                      >
                        <Link href={subItem.href}>
                          <span className="font-light">{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
