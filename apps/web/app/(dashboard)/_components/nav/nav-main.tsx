'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@workspace/ui/components/sidebar'
import { cn } from '@workspace/ui/lib/utils'
import { Copy, Folder, type LucideIcon, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavMain({
	main,
}: {
	main: {
		name: string
		href: string
		icon: LucideIcon
	}[]
}) {
	const { isMobile, toggleSidebar } = useSidebar()
	const pathname = usePathname()

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{main.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton
							asChild
							onClick={isMobile ? toggleSidebar : undefined}
							className={cn({ 'bg-gray-100': pathname === item.href })}
						>
							<Link href={item.href}>
								<item.icon strokeWidth={1} />
								<span className="font-light">{item.name}</span>
							</Link>
						</SidebarMenuButton>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuAction showOnHover className="hidden">
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
									<Folder strokeWidth={1} className="text-muted-foreground" />
									<span className="font-light">View Spreadsheets</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Copy strokeWidth={1} className="text-muted-foreground" />
									<span className="font-light">Copy link</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<Trash2 strokeWidth={1} className="text-muted-foreground" />
									<span className="font-light">Delete spreadsheets</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
