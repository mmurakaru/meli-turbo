import { redirect } from 'next/navigation'
import { getDocument, getUser, getWorkspacesForUser } from '@/lib/db/queries'
import { SpreadsheetView } from '@/app/(dashboard)/_components/spreadsheet-view'
import { DocumentHeader } from './document-header'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
	const id = (await params).id

	const user = await getUser()
	if (!user) {
		redirect('/sign-in')
	}

	const document = await getDocument(id, user.id)

	if (!document) {
		redirect('/not-found')
	}

	const userWorkspaces = await getWorkspacesForUser(user.id)
	const firstWorkspace = userWorkspaces[0]

	const hasPermission =
		(document.ownerId === user.id && document.ownerType === 'user') ||
		(firstWorkspace && document.ownerId === firstWorkspace.id && document.ownerType === 'workspace')

	if (!hasPermission) {
		redirect('/not-found')
	}

	return (
		<section className="flex-1 p-6">
			<DocumentHeader documentId={document.id} description={document.description} title={document.title} />
			<div className="mt-6">
				<SpreadsheetView columns={document.data.columns} rows={document.data.rows} />
			</div>
		</section>
	)
}
