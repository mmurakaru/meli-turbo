import { redirect } from 'next/navigation'
import { Settings } from '@/app/(dashboard)/dashboard/workspace/settings'
import { getUser, getWorkspaceById } from '@/lib/db/queries'
import type { WorkspaceDataWithMembers } from '@/lib/db/schema'

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

	return <Settings workspaceData={workspaceData as WorkspaceDataWithMembers} />
}
