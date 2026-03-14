import { redirect } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/auth/dal'
import { getUser } from '@/lib/db/queries'
import type { Workspace } from '@/lib/db/schema'
import { NewDocument } from './new-document'

export default async function NewDocumentPage() {
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const activeWorkspace = await getActiveWorkspace()

	return <NewDocument workspace={activeWorkspace as Workspace | null} />
}
