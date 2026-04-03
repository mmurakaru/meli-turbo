import { redirect } from 'next/navigation'
import { getDocument, getUser, getWorkspacesForUser } from '@/lib/db/queries'
import { DocumentHeader } from './document-header'
import { EditableSpreadsheet } from './editable-spreadsheet'

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

	const hasPermission =
		(document.ownerId === user.id && document.ownerType === 'user') ||
		(document.ownerType === 'workspace' &&
			userWorkspaces.some((workspace) => workspace.id === document.ownerId))

	if (!hasPermission) {
		redirect('/not-found')
	}

	return (
		<section className="flex-1 p-6">
			<DocumentHeader
				documentId={document.id}
				description={document.description}
				title={document.title}
			/>
			<div className="mt-6">
				<EditableSpreadsheet
					documentId={document.id}
					documentTitle={document.title}
					initialColumns={document.data.columns}
					initialRows={document.data.rows}
				/>
			</div>
		</section>
	)
}
