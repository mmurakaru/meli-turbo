import { redirect } from 'next/navigation'
import { getUser, getWorkspacesForUser } from '@/lib/db/queries'

export default async function WorkspacePage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const workspacesList = await getWorkspacesForUser(user.id)
	const firstWorkspace = workspacesList[0]

	if (!firstWorkspace) {
		throw new Error('Workspace not found')
	}

	redirect(`/workspace/${firstWorkspace.id}/settings`)
}
