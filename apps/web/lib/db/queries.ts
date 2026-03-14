import { and, desc, eq, or } from 'drizzle-orm'
import { getUser as getSessionUser } from '@/lib/auth/dal'
import { db } from './drizzle'
import { activityLogs, documents, type OwnerType, publicUsers, teamMembers, teams } from './schema'

export { getUser } from '@/lib/auth/dal'

export async function getTeamByStripeCustomerId(customerId: string) {
	const result = await db
		.select()
		.from(teams)
		.where(eq(teams.stripeCustomerId, customerId))
		.limit(1)

	return result.length > 0 ? result[0] : null
}

export async function updateTeamSubscription(
	teamId: string,
	subscriptionData: {
		stripeSubscriptionId: string | null
		stripeProductId: string | null
		planName: string | null
		subscriptionStatus: string
	},
) {
	await db
		.update(teams)
		.set({
			...subscriptionData,
			updatedAt: new Date(),
		})
		.where(eq(teams.id, teamId))
}

export async function getUserWithTeam(userId: string) {
	const [result] = await db
		.select({
			user: publicUsers,
			teamId: teamMembers.teamId,
		})
		.from(publicUsers)
		.leftJoin(teamMembers, eq(publicUsers.id, teamMembers.userId))
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

export async function getTeamForUser(userId: string) {
	const result = await db.query.publicUsers.findFirst({
		where: eq(publicUsers.id, userId),
		with: {
			teamMembers: {
				with: {
					team: {
						with: {
							teamMembers: {
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

	return result?.teamMembers[0]?.team || null
}

export async function getDocumentsForOwner(userId: string, ownerType: OwnerType) {
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
		.where(and(eq(documents.ownerId, userId), eq(documents.ownerType, ownerType)))
		.orderBy(desc(documents.updatedAt))
		.limit(10)
}

export async function getAllDocuments(userId: string) {
	const userWithTeam = await getUserWithTeam(userId)

	if (!userWithTeam || !userWithTeam.teamId) {
		// If the user is not part of a team, only return their personal documents
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

	// If the user is part of a team, return both their personal documents and their team's documents
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
				and(eq(documents.ownerId, userWithTeam.teamId), eq(documents.ownerType, 'team')),
			),
		)
		.orderBy(desc(documents.updatedAt))
		.limit(10)
}

export async function getDocument(documentId: number, userId: string) {
	const userWithTeam = await getUserWithTeam(userId)

	if (!userWithTeam) return

	const teamId = userWithTeam.teamId
	const ownershipFilter = teamId
		? or(
				and(eq(documents.ownerId, userId), eq(documents.ownerType, 'user')),
				and(eq(documents.ownerId, teamId), eq(documents.ownerType, 'team')),
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
