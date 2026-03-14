import 'server-only'

import { and, eq, isNull } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from '@/lib/db/drizzle'
import { publicUsers, workspaceMembers, workspaces } from '@/lib/db/schema'
import { decrypt } from './session'

export const verifySession = cache(async () => {
	const cookie = (await cookies()).get('session')?.value
	const session = await decrypt(cookie)

	if (!session?.userId) {
		redirect('/sign-in')
	}

	return { isAuth: true, userId: session.userId }
})

export const getUser = cache(async () => {
	const session = await decrypt((await cookies()).get('session')?.value)

	if (!session?.userId) {
		return null
	}

	const result = await db
		.select()
		.from(publicUsers)
		.where(and(eq(publicUsers.id, session.userId), isNull(publicUsers.deletedAt)))
		.limit(1)

	return result[0] ?? null
})

export const getActiveWorkspace = cache(async () => {
	const session = await verifySession().catch(() => null)
	if (!session) return null

	const cookieStore = await cookies()
	const activeWorkspaceId = cookieStore.get('active_workspace')?.value

	if (activeWorkspaceId) {
		const [result] = await db
			.select({ workspace: workspaces })
			.from(workspaceMembers)
			.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
			.where(
				and(
					eq(workspaceMembers.userId, session.userId),
					eq(workspaceMembers.workspaceId, activeWorkspaceId),
				),
			)
			.limit(1)

		if (result) return result.workspace
	}

	// Fall back to first workspace the user is a member of
	const [result] = await db
		.select({ workspace: workspaces })
		.from(workspaceMembers)
		.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
		.where(eq(workspaceMembers.userId, session.userId))
		.limit(1)

	return result?.workspace ?? null
})
