'use client'

import { Separator } from '@workspace/ui/components/separator'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from '@workspace/ui/components/sidebar'
import { cn } from '@workspace/ui/lib/utils'
import { Building2, ChartColumn, CircleUser, Clock, Sparkles, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as React from 'react'
import type { Workspace } from '@/lib/db/schema'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

const staticMain = [
	{
		name: 'Recents',
		href: '/dashboard',
		icon: Clock,
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
]

export function AppSidebar({
	workspaces = [],
	...props
}: React.ComponentProps<typeof Sidebar> & { workspaces?: Workspace[] }) {
	const { toggleSidebar, isMobile } = useSidebar()
	const pathname = usePathname()

	const workspaceNavItems = workspaces.map((workspace) => ({
		name: 'Workspace',
		href: `/workspace/${workspace.id}`,
		icon: Building2,
	}))

	const mainNavItems = [...staticMain.slice(0, 1), ...workspaceNavItems, ...staticMain.slice(1)]

	const settingsHref =
		workspaces.length > 0 ? `/workspace/${workspaces[0].id}/settings` : '/dashboard/workspace'

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<NavUser />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href="/pricing">
									<Sparkles strokeWidth={1} className="text-[#2d3af7]" />
									<span className="font-light text-gradient">Upgrade this workspace</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>

				<NavMain main={mainNavItems} />
				{/* <NavConfiguration items={data.configuration} /> */}
			</SidebarContent>
			<SidebarFooter>
				<Separator className="my-2" />
				<SidebarMenuButton
					className={cn(
						'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
						{
							'bg-gray-100': pathname === settingsHref,
						},
					)}
					onClick={isMobile ? toggleSidebar : undefined}
					asChild
				>
					<Link href={settingsHref}>
						<UserPlus strokeWidth={1} className="h-4 w-4" />
						<span className="font-light">Invite members</span>
					</Link>
				</SidebarMenuButton>
				{/* TODO(MM): schema update - Allow many workspaces for one profile */}
				{/* <TeamSwitcher teams={data.teams} /> */}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
