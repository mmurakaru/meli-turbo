'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@workspace/ui/components/sidebar'
import { ChevronsUpDown, Plus } from 'lucide-react'
import * as React from 'react'

export function TeamSwitcher({
	teams,
}: {
	teams: {
		name: string
		logo: React.ElementType
		plan: string
	}[]
}) {
	const [activeTeam, setActiveTeam] = React.useState(teams[0])

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="sm"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="size-6 grid place-items-center shrink-0">
								<activeTeam.logo className="size-4 stroke-1" />
							</div>

							<span className="text-sm font-medium truncate">{activeTeam.name}</span>
							<ChevronsUpDown strokeWidth={1} className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side="top"
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs font-normal text-sidebar-foreground/70">
							Teams
						</DropdownMenuLabel>
						{teams.map((team, index) => (
							<DropdownMenuItem
								key={team.name}
								onClick={() => setActiveTeam(team)}
								className="gap-2 p-2"
							>
								<team.logo className="size-4 shrink-0 stroke-1" />
								{team.name}
								<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2">
							<Plus strokeWidth={1} className="size-4" />
							<div className="text-sm font-normal text-sidebar-foreground/70">Add workspace</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
