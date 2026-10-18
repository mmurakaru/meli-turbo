import { and, desc, eq, or } from 'drizzle-orm'
import { getUser as getSessionUser } from '@/lib/auth/dal'
import { db } from './drizzle'
import {
	activityLogs,
	documents,
	type OwnerType,
	publicUsers,
	workspaceMembers,
	workspaces,
} from './schema'

export { getUser } from '@/lib/auth/dal'

export async function getWorkspaceByStripeCustomerId(customerId: string) {
	const result = await db
		.select()
		.from(workspaces)
		.where(eq(workspaces.stripeCustomerId, customerId))
		.limit(1)

	return result.length > 0 ? result[0] : null
}

export async function updateWorkspaceSubscription(
	workspaceId: string,
	subscriptionData: {
		stripeSubscriptionId: string | null
		stripeProductId: string | null
		planName: string | null
		subscriptionStatus: string
	},
) {
	await db
		.update(workspaces)
		.set({
			...subscriptionData,
			updatedAt: new Date(),
		})
		.where(eq(workspaces.id, workspaceId))
}

export async function getUserWithWorkspace(userId: string) {
	const [result] = await db
		.select({
			user: publicUsers,
			workspaceId: workspaceMembers.workspaceId,
		})
		.from(publicUsers)
		.leftJoin(workspaceMembers, eq(publicUsers.id, workspaceMembers.userId))
		.where(eq(publicUsers.id, userId))
		.limit(1)

	return result
}

export async function getActivityLogs() {
	const user = await getSessionUser()
	if (!user) {
		throw new Error('User not authenticated')
	}

	return await db
		.select({
			id: activityLogs.id,
			action: activityLogs.action,
			timestamp: activityLogs.timestamp,
			ipAddress: activityLogs.ipAddress,
			userName: publicUsers.name,
		})
		.from(activityLogs)
		.leftJoin(publicUsers, eq(activityLogs.userId, publicUsers.id))
		.where(eq(activityLogs.userId, user.id))
		.orderBy(desc(activityLogs.timestamp))
		.limit(10)
}

export async function getWorkspacesForUser(userId: string) {
	const result = await db.query.publicUsers.findFirst({
		where: eq(publicUsers.id, userId),
		with: {
			workspaceMembers: {
				with: {
					workspace: {
						with: {
							workspaceMembers: {
								with: {
									user: {
										columns: {
											id: true,
											email: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	})

	return result?.workspaceMembers.map((wm) => wm.workspace) ?? []
}

export async function getWorkspaceById(workspaceId: string, userId: string) {
	const result = await db.query.publicUsers.findFirst({
		where: eq(publicUsers.id, userId),
		with: {
			workspaceMembers: {
				where: eq(workspaceMembers.workspaceId, workspaceId),
				with: {
					workspace: {
						with: {
							workspaceMembers: {
								with: {
									user: {
										columns: {
											id: true,
											email: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	})

	return result?.workspaceMembers[0]?.workspace || null
}

export async function getDocumentsForOwner(ownerId: string, ownerType: OwnerType) {
	return await db
		.select({
			id: documents.id,
			title: documents.title,
			ownerId: documents.ownerId,
			ownerType: documents.ownerType,
			description: documents.description,
			createdAt: documents.createdAt,
			updatedAt: documents.updatedAt,
			deletedAt: documents.deletedAt,
		})
		.from(documents)
		.where(and(eq(documents.ownerId, ownerId), eq(documents.ownerType, ownerType)))
		.orderBy(desc(documents.updatedAt))
		.limit(10)
}

export async function getAllDocuments(userId: string) {
	const userWithWorkspace = await getUserWithWorkspace(userId)

	if (!userWithWorkspace?.workspaceId) {
		// If the user is not part of a workspace, only return their personal documents
		return await db
			.select({
				id: documents.id,
				title: documents.title,
				ownerId: documents.ownerId,
				ownerType: documents.ownerType,
				description: documents.description,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
				deletedAt: documents.deletedAt,
			})
			.from(documents)
			.where(and(eq(documents.ownerId, userId), eq(documents.ownerType, 'user')))
			.orderBy(desc(documents.updatedAt))
			.limit(10)
	}

	// If the user is part of a workspace, return both their personal documents and their workspace's documents
	return await db
		.select({
			id: documents.id,
			title: documents.title,
			ownerId: documents.ownerId,
			ownerType: documents.ownerType,
			description: documents.description,
			createdAt: documents.createdAt,
			updatedAt: documents.updatedAt,
			deletedAt: documents.deletedAt,
		})
		.from(documents)
		.where(
			or(
				and(eq(documents.ownerId, userId), eq(documents.ownerType, 'user')),
				and(
					eq(documents.ownerId, userWithWorkspace.workspaceId),
					eq(documents.ownerType, 'workspace'),
				),
			),
		)
		.orderBy(desc(documents.updatedAt))
		.limit(10)
}

export async function getDocument(documentId: string, userId: string) {
	const userWithWorkspace = await getUserWithWorkspace(userId)

	if (!userWithWorkspace) return

	const workspaceId = userWithWorkspace.workspaceId
	const ownershipFilter = workspaceId
		? or(
				and(eq(documents.ownerId, userId), eq(documents.ownerType, 'user')),
				and(eq(documents.ownerId, workspaceId), eq(documents.ownerType, 'workspace')),
			)
		: and(eq(documents.ownerId, userId), eq(documents.ownerType, 'user'))

	const query = db
		.select({
			id: documents.id,
			title: documents.title,
			ownerId: documents.ownerId,
			ownerType: documents.ownerType,
			description: documents.description,
			data: documents.data,
			createdAt: documents.createdAt,
			updatedAt: documents.updatedAt,
			deletedAt: documents.deletedAt,
		})
		.from(documents)
		.where(and(eq(documents.id, documentId), ownershipFilter))
		.limit(1)

	const result = await query

	return result.length > 0 ? result[0] : null
}
