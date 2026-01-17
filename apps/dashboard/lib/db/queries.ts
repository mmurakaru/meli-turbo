import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'
import { db } from './drizzle'
import { activityLogs, type OwnerType, publicUsers, teamMembers, teams, tours } from './schema'

export async function getUser() {
	const supabase = await createClient()

	const {
		error,
		data: { user: authUser },
	} = await supabase.auth.getUser()

	if (error || !authUser) {
		return null
	}

	const publicUser = await db
		.select()
		.from(publicUsers)
		.where(and(eq(publicUsers.id, authUser.id), isNull(publicUsers.deletedAt)))
		.limit(1)

	if (publicUser.length === 0) {
		return null
	}

	return publicUser[0]
}

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
	const supabase = await createClient()

	const {
		error,
		data: { user },
	} = await supabase.auth.getUser()
	if (error || !user) {
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

export async function getToursForOwner(userId: string, ownerType: OwnerType) {
	return await db
		.select({
			id: tours.id,
			title: tours.title,
			ownerId: tours.ownerId,
			ownerType: tours.ownerType,
			description: tours.description,
			createdAt: tours.createdAt,
			updatedAt: tours.updatedAt,
			deletedAt: tours.deletedAt,
		})
		.from(tours)
		.where(and(eq(tours.ownerId, userId), eq(tours.ownerType, ownerType)))
		.orderBy(desc(tours.updatedAt))
		.limit(10)
}

export async function getAllTours(userId: string) {
	const userWithTeam = await getUserWithTeam(userId)

	if (!userWithTeam || !userWithTeam.teamId) {
		// If the user is not part of a team, only return their personal tours
		return await db
			.select({
				id: tours.id,
				title: tours.title,
				ownerId: tours.ownerId,
				ownerType: tours.ownerType,
				description: tours.description,
				createdAt: tours.createdAt,
				updatedAt: tours.updatedAt,
				deletedAt: tours.deletedAt,
			})
			.from(tours)
			.where(and(eq(tours.ownerId, userId), eq(tours.ownerType, 'user')))
			.orderBy(desc(tours.updatedAt))
			.limit(10)
	}

	// If the user is part of a team, return both their personal tours and their team's tours
	return await db
		.select({
			id: tours.id,
			title: tours.title,
			ownerId: tours.ownerId,
			ownerType: tours.ownerType,
			description: tours.description,
			createdAt: tours.createdAt,
			updatedAt: tours.updatedAt,
			deletedAt: tours.deletedAt,
		})
		.from(tours)
		.where(
			or(
				and(eq(tours.ownerId, userId), eq(tours.ownerType, 'user')),
				and(eq(tours.ownerId, userWithTeam.teamId), eq(tours.ownerType, 'team')),
			),
		)
		.orderBy(desc(tours.updatedAt))
		.limit(10)
}

export async function getTour(tourId: number, userId: string) {
	const userWithTeam = await getUserWithTeam(userId)

	if (!userWithTeam) return

	const teamId = userWithTeam.teamId
	const ownershipFilter = teamId
		? or(
				and(eq(tours.ownerId, userId), eq(tours.ownerType, 'user')),
				and(eq(tours.ownerId, teamId), eq(tours.ownerType, 'team')),
			)
		: and(eq(tours.ownerId, userId), eq(tours.ownerType, 'user'))

	const query = db
		.select({
			id: tours.id,
			title: tours.title,
			ownerId: tours.ownerId,
			ownerType: tours.ownerType,
			description: tours.description,
			createdAt: tours.createdAt,
			updatedAt: tours.updatedAt,
			deletedAt: tours.deletedAt,
		})
		.from(tours)
		.where(and(eq(tours.id, tourId), ownershipFilter))
		.limit(1)

	const result = await query

	return result.length > 0 ? result[0] : null
}
