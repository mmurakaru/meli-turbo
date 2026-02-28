'use server'

import bcrypt from 'bcryptjs'
import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { env } from '@/env'
import { getUser } from '@/lib/auth/dal'
import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware'
import { createSession, deleteSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { getUserWithTeam } from '@/lib/db/queries'
import {
	ActivityType,
	activityLogs,
	invitations,
	type NewActivityLog,
	type NewTeam,
	type NewTeamMember,
	type NewUser,
	publicUsers,
	teamMembers,
	teams,
} from '@/lib/db/schema'
import { createCheckoutSession } from '@/lib/payments/stripe'

export async function logActivity(
	teamId: string | null | undefined,
	userId: string,
	type: ActivityType,
	ipAddress?: string,
) {
	if (teamId === null || teamId === undefined) {
		return
	}
	const newActivity: NewActivityLog = {
		teamId,
		userId,
		action: type,
		ipAddress: ipAddress || '',
	}
	await db.insert(activityLogs).values(newActivity)
}

export async function signInWithOAuth(inviteId?: string | null) {
	const { Google } = await import('arctic')
	const origin = (await headers()).get('origin')

	const google = new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		`${origin}/auth/callback`,
	)

	const state = crypto.randomUUID()
	const codeVerifier = crypto.randomUUID()
	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile'])

	if (inviteId) {
		url.searchParams.set('inviteId', inviteId)
	}

	const { cookies } = await import('next/headers')
	const cookieStore = await cookies()
	cookieStore.set('oauth_state', state, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		maxAge: 600,
		path: '/',
	})
	cookieStore.set('oauth_code_verifier', codeVerifier, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		maxAge: 600,
		path: '/',
	})

	redirect(url.toString())
}

const signInSchema = z.object({
	email: z.string().email().min(3).max(255),
	password: z.string().min(8).max(100),
})

export const signIn = validatedAction(signInSchema, async (data, formData) => {
	const { email, password } = data

	const [user] = await db
		.select()
		.from(publicUsers)
		.where(and(eq(publicUsers.email, email), eq(sql`${publicUsers.deletedAt} IS NULL`, sql`TRUE`)))
		.limit(1)

	if (!user || !user.passwordHash) {
		return { error: 'Invalid email or password. Please try again.' }
	}

	const passwordValid = await bcrypt.compare(password, user.passwordHash)
	if (!passwordValid) {
		return { error: 'Invalid email or password. Please try again.' }
	}

	const userWithTeam = await getUserWithTeam(user.id)

	await Promise.all([logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_IN)])

	await createSession(user.id)

	const redirectTo = formData.get('redirect') as string | null
	if (redirectTo === 'checkout') {
		const priceId = formData.get('priceId') as string
		const team = userWithTeam?.teamId
			? (await db.select().from(teams).where(eq(teams.id, userWithTeam.teamId)).limit(1))[0]
			: null
		return createCheckoutSession({ team: team ?? null, priceId })
	}

	redirect('/dashboard')
})

const signUpSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	inviteId: z.string().optional(),
})

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
	const { email, password, inviteId } = data

	const existingUser = await db
		.select()
		.from(publicUsers)
		.where(eq(publicUsers.email, email))
		.limit(1)

	if (existingUser.length) {
		return { error: 'An account with this email already exists. Please sign in.' }
	}

	const passwordHash = await bcrypt.hash(password, 12)

	const newUser: NewUser = {
		email,
		passwordHash,
		role: 'owner',
	}

	const [createdUser] = await db.insert(publicUsers).values(newUser).returning()

	if (!createdUser) {
		return { error: 'Failed to create user. Please try again.' }
	}

	let teamId: string
	let userRole: string
	let createdTeam: typeof teams.$inferSelect | null = null

	if (inviteId) {
		const [invitation] = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.id, parseInt(inviteId, 10)),
					eq(invitations.email, email),
					eq(invitations.status, 'pending'),
				),
			)
			.limit(1)

		if (invitation) {
			teamId = invitation.teamId
			userRole = invitation.role

			await db
				.update(invitations)
				.set({ status: 'accepted' })
				.where(eq(invitations.id, invitation.id))
			await db.update(publicUsers).set({ role: userRole }).where(eq(publicUsers.id, createdUser.id))

			await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION)

			;[createdTeam] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
		} else {
			return { error: 'Invalid or expired invitation.' }
		}
	} else {
		const newTeam: NewTeam = {
			name: `${email}'s Team`,
		}

		;[createdTeam] = await db.insert(teams).values(newTeam).returning()

		if (!createdTeam) {
			return { error: 'Failed to create team. Please try again.' }
		}

		teamId = createdTeam.id
		userRole = 'owner'

		await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM)
	}

	const newTeamMember: NewTeamMember = {
		userId: createdUser.id,
		teamId,
		role: userRole,
	}

	await Promise.all([
		db.insert(teamMembers).values(newTeamMember),
		logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
	])

	await createSession(createdUser.id)

	const redirectTo = formData.get('redirect') as string | null
	if (redirectTo === 'checkout') {
		const priceId = formData.get('priceId') as string
		return createCheckoutSession({ team: createdTeam, priceId })
	}

	redirect('/dashboard')
})

export async function signOut() {
	const user = await getUser()

	if (user) {
		const userWithTeam = await getUserWithTeam(user.id)
		if (userWithTeam) {
			await logActivity(userWithTeam.teamId, user.id, ActivityType.SIGN_OUT)
		}
	}

	await deleteSession()
	redirect('/')
}

const updatePasswordSchema = z
	.object({
		currentPassword: z.string().min(8).max(100),
		newPassword: z.string().min(8).max(100),
		confirmPassword: z.string().min(8).max(100),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	})

export const updatePassword = validatedActionWithUser(
	updatePasswordSchema,
	async (data, _, user) => {
		const { currentPassword, newPassword } = data

		if (!user.passwordHash) {
			return { error: 'Password update not available for OAuth accounts.' }
		}

		const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash)
		if (!passwordValid) {
			return { error: 'Current password is incorrect.' }
		}

		if (currentPassword === newPassword) {
			return { error: 'New password must be different from the current password.' }
		}

		const newPasswordHash = await bcrypt.hash(newPassword, 12)

		await db
			.update(publicUsers)
			.set({ passwordHash: newPasswordHash })
			.where(eq(publicUsers.id, user.id))

		const userWithTeam = await getUserWithTeam(user.id)
		await logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD)

		return { success: 'Password updated successfully.' }
	},
)

const deleteAccountSchema = z.object({
	password: z.string().min(8).max(100),
})

export const deleteAccount = validatedActionWithUser(deleteAccountSchema, async (data, _, user) => {
	const { password } = data

	if (!user.passwordHash) {
		return { error: 'Account deletion requires password verification.' }
	}

	const passwordValid = await bcrypt.compare(password, user.passwordHash)
	if (!passwordValid) {
		return { error: 'Incorrect password. Account deletion failed.' }
	}

	const userWithTeam = await getUserWithTeam(user.id)

	await logActivity(userWithTeam?.teamId, user.id, ActivityType.DELETE_ACCOUNT)

	await db
		.update(publicUsers)
		.set({
			deletedAt: sql`CURRENT_TIMESTAMP`,
			name: sql`CONCAT(name, '-', id, '-deleted')`,
			email: sql`CONCAT(email, '-', id, '-deleted')`,
		})
		.where(eq(publicUsers.id, user.id))

	if (userWithTeam?.teamId) {
		await db
			.delete(teamMembers)
			.where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)))
	}

	await deleteSession()
	redirect('/sign-in')
})

const updateAccountSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	email: z.string().email('Invalid email address'),
})

export const updateAccount = validatedActionWithUser(updateAccountSchema, async (data, _, user) => {
	const { name, email } = data
	const userWithTeam = await getUserWithTeam(user.id)

	await Promise.all([
		db.update(publicUsers).set({ name, email }).where(eq(publicUsers.id, user.id)),
		logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
	])

	return { success: 'Account updated successfully.' }
})

const removeTeamMemberSchema = z.object({
	memberId: z.number(),
})

export const removeTeamMember = validatedActionWithUser(
	removeTeamMemberSchema,
	async (data, _, user) => {
		const { memberId } = data
		const userWithTeam = await getUserWithTeam(user.id)

		if (!userWithTeam?.teamId) {
			return { error: 'User is not part of a team' }
		}

		await db
			.delete(teamMembers)
			.where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, userWithTeam.teamId)))

		await logActivity(userWithTeam.teamId, user.id, ActivityType.REMOVE_TEAM_MEMBER)

		return { success: 'Team member removed successfully' }
	},
)

const inviteTeamMemberSchema = z.object({
	email: z.string().email('Invalid email address'),
	role: z.enum(['member', 'owner']),
})

export const inviteTeamMember = validatedActionWithUser(
	inviteTeamMemberSchema,
	async (data, _, user) => {
		const { email, role } = data
		const userWithTeam = await getUserWithTeam(user.id)

		if (!userWithTeam?.teamId) {
			return { error: 'User is not part of a team' }
		}

		const existingMember = await db
			.select()
			.from(publicUsers)
			.leftJoin(teamMembers, eq(publicUsers.id, teamMembers.userId))
			.where(and(eq(publicUsers.email, email), eq(teamMembers.teamId, userWithTeam.teamId)))
			.limit(1)

		if (existingMember.length > 0) {
			return { error: 'User is already a member of this team' }
		}

		const existingInvitation = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.email, email),
					eq(invitations.teamId, userWithTeam.teamId),
					eq(invitations.status, 'pending'),
				),
			)
			.limit(1)

		if (existingInvitation.length > 0) {
			return { error: 'An invitation has already been sent to this email' }
		}

		await db.insert(invitations).values({
			teamId: userWithTeam.teamId,
			email,
			role,
			invitedBy: user.id,
			status: 'pending',
		})

		await logActivity(userWithTeam.teamId, user.id, ActivityType.INVITE_TEAM_MEMBER)

		// TODO: Send invitation email and include ?inviteId={id} to sign-up URL

		return { success: 'Invitation sent successfully' }
	},
)
