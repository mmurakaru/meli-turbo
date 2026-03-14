import { redirect } from 'next/navigation'
import { getUser, getWorkspacesForUser } from '@/lib/db/queries'
import type { Workspace } from '@/lib/db/schema'
import { NewDocument } from './new-document'

export default async function NewDocumentPage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const workspaces = await getWorkspacesForUser(user.id)

	return <NewDocument workspaces={workspaces as Workspace[]} />
}
