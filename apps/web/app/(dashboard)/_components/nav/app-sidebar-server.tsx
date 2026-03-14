import { getUser, getWorkspacesForUser } from '@/lib/db/queries'
import type { Workspace } from '@/lib/db/schema'
import { AppSidebar } from './app-sidebar'

export async function AppSidebarServer() {
	const user = await getUser()
	const workspaces: Workspace[] = user ? ((await getWorkspacesForUser(user.id)) as Workspace[]) : []

	return <AppSidebar workspaces={workspaces} />
}
