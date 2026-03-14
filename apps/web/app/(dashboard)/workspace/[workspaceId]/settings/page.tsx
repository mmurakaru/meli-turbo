import { count } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Settings } from '@/app/(dashboard)/dashboard/workspace/settings'
import { db } from '@/lib/db/drizzle'
import { getUser, getWorkspaceById } from '@/lib/db/queries'
import { documents, type WorkspaceDataWithMembers } from '@/lib/db/schema'

export default async function WorkspaceSettingsPage({
	params,
}: {
	params: Promise<{ workspaceId: string }>
}) {
	const { workspaceId } = await params
	const user = await getUser()

	if (!user) {
		redirect('/sign-in')
	}

	const workspaceData = await getWorkspaceById(workspaceId, user.id)

	if (!workspaceData) {
		redirect('/dashboard')
	}

	const [{ documentCount }] = await db
		.select({ documentCount: count() })
		.from(documents)
		.where(eq(documents.ownerId, workspaceId))

	return (
		<Settings
			workspaceData={workspaceData as WorkspaceDataWithMembers}
			documentCount={documentCount}
		/>
	)
}
