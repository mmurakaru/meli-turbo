import { redirect } from 'next/navigation'
import { getDocumentsForOwner, getUser, getWorkspaceById } from '@/lib/db/queries'
import { WorkspaceDocuments } from './workspace-documents'

export default async function WorkspaceIdPage({
	params,
}: {
	params: Promise<{ workspaceId: string }>
}) {
	const { workspaceId } = await params
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const workspace = await getWorkspaceById(workspaceId, user.id)

	if (!workspace) {
		redirect('/dashboard')
	}

	const documentData = await getDocumentsForOwner(workspace.id, 'workspace')

	return <WorkspaceDocuments workspace={workspace} documentData={documentData} />
}
