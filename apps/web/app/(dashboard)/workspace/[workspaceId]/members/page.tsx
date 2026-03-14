import { redirect } from 'next/navigation'
import { getUser, getWorkspaceById } from '@/lib/db/queries'
import type { WorkspaceDataWithMembers } from '@/lib/db/schema'
import { InviteForm } from './invite-form'
import { MembersTable } from './members-table'

export default async function WorkspaceMembersPage({
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

	const { workspaceMembers } = workspace as WorkspaceDataWithMembers

	const isPaid =
		workspace.subscriptionStatus === 'active' || workspace.subscriptionStatus === 'trialing'

	return (
		<section className="max-w-4xl">
			<h1 className="text-2xl font-extrabold mb-6">Workspace members</h1>
			<InviteForm workspaceId={workspaceId} isPaid={isPaid} />
			<MembersTable members={workspaceMembers} />
		</section>
	)
}
