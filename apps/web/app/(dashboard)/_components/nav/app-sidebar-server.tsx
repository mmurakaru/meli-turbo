import { getActiveWorkspace } from '@/lib/auth/dal'
import type { Workspace } from '@/lib/db/schema'
import { AppSidebar } from './app-sidebar'

export async function AppSidebarServer() {
	const activeWorkspace = await getActiveWorkspace()

	return <AppSidebar activeWorkspace={activeWorkspace as Workspace | null} />
}
