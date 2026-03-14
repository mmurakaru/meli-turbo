'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@workspace/ui/components/sidebar'
import { toast } from '@workspace/ui/components/sonner'
import { cn } from '@workspace/ui/lib/utils'
import { Check, ChevronsUpDown, LogOut, Plus, Settings, Sparkles, UserCog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { signOut } from '@/app/(login)/actions'
import { useUser } from '@/lib/auth'
import type { Workspace } from '@/lib/db/schema'
import { getWorkspace, switchWorkspace } from '../../actions'

export function NavUser({ activeWorkspaceId }: { activeWorkspaceId: string | null }) {
	const { user, setUser } = useUser()
	const pathname = usePathname()
	const { toggleSidebar, isMobile } = useSidebar()
	const [isPending, startTransition] = useTransition()

	const [workspaces, setWorkspaces] = useState<Workspace[]>([])

	useEffect(() => {
		if (user?.id) {
			getWorkspace(user.id)
				.then((workspace) => setWorkspaces(workspace as Workspace[]))
				.catch(() => toast.error('Error fetching workspace data'))
		}
	}, [user])

	function handleSwitch(workspaceId: string) {
		startTransition(async () => {
			await switchWorkspace(workspaceId)
		})
	}

	async function handleSignOut() {
		setUser(null)
		await signOut()
	}

	const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0]

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
							<ChevronsUpDown strokeWidth={1} className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg gap-2"
						side="bottom"
						align="end"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<SidebarMenuButton
								asChild
								className={cn({
									'bg-gray-100': activeWorkspace
										? pathname.startsWith(`/workspace/${activeWorkspace.id}/settings`)
										: false,
								})}
							>
								<Link
									href={
										activeWorkspace
											? `/workspace/${activeWorkspace.id}/settings`
											: '/dashboard/workspace'
									}
								>
									<Settings strokeWidth={1} />
									<span className="font-light">Workspace settings</span>
								</Link>
							</SidebarMenuButton>
							<SidebarMenuButton asChild>
								<Link href="/pricing">
									<Sparkles strokeWidth={1} className="text-[#2d3af7]" />
									<span className="font-light text-gradient">Upgrade this workspace</span>
								</Link>
							</SidebarMenuButton>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="text-xs font-normal text-sidebar-foreground/70">
							Workspaces
						</DropdownMenuLabel>
						<DropdownMenuGroup className="grid gap-1">
							{workspaces.map((workspace) => {
								const isActive = workspace.id === (activeWorkspace?.id ?? null)
								return (
									<SidebarMenuButton
										key={workspace.id}
										disabled={isPending}
										onClick={() => !isActive && handleSwitch(workspace.id)}
										className={cn('cursor-pointer', { 'bg-gray-100': isActive })}
									>
										<Avatar className="size-6">
											<AvatarFallback className="bg-violet-500 text-white text-xs font-medium">
												{workspace.name[0].toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-xs leading-tight">
											<span className="font-medium truncate">{workspace.name}</span>
											<span className="text-sidebar-foreground/70 truncate">
												{workspace.planName ? `${workspace.planName} plan` : 'Free plan'}
											</span>
										</div>
										{isActive && <Check strokeWidth={1} className="ml-auto size-3" />}
									</SidebarMenuButton>
								)
							})}
							<SidebarMenuButton asChild>
								<Link href="/workspace/new">
									<Plus strokeWidth={1} />
									<span className="font-light">Create a new workspace</span>
								</Link>
							</SidebarMenuButton>
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
							<form action={handleSignOut}>
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
	)
}
