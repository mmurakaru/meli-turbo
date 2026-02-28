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
import { CircleUser, Clock, Sparkles, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as React from 'react'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

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
		// {
		//   name: 'Analytics',
		//   href: '/dashboard/analytics',
		//   icon: ChartColumn,
		// },
	],
	// configuration: [
	//   {
	//     title: 'Voice AI',
	//     href: '/dashboard/voice-ai',
	//     icon: Bot,
	//     items: null,
	//   },
	// ],
	settings: [{ href: '/dashboard/workspace', icon: UserPlus, label: 'Invite members' }],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { toggleSidebar, isMobile } = useSidebar()
	const pathname = usePathname()

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

				<NavMain main={data.main} />
				{/* <NavConfiguration items={data.configuration} /> */}
			</SidebarContent>
			<SidebarFooter>
				<Separator className="my-2" />
				{data.settings.map((item) => (
					<SidebarMenuButton
						key={item.href}
						className={cn(
							'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
							{
								'bg-gray-100': pathname === item.href,
							},
						)}
						onClick={isMobile ? toggleSidebar : undefined}
						asChild
					>
						<Link href={item.href}>
							<item.icon strokeWidth={1} className="h-4 w-4" />
							<span className="font-light">{item.label}</span>
						</Link>
					</SidebarMenuButton>
				))}
				{/* TODO(MM): schema update - Allow many workspaces for one profile */}
				{/* <TeamSwitcher teams={data.teams} /> */}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
