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
import { getUserWithWorkspace } from '@/lib/db/queries'
import {
	ActivityType,
	activityLogs,
	invitations,
	type NewActivityLog,
	type NewUser,
	type NewWorkspace,
	type NewWorkspaceMember,
	publicUsers,
	workspaceMembers,
	workspaces,
} from '@/lib/db/schema'
import { createCheckoutSession } from '@/lib/payments/stripe'

export async function logActivity(
	workspaceId: string | null | undefined,
	userId: string,
	type: ActivityType,
	ipAddress?: string,
) {
	if (workspaceId === null || workspaceId === undefined) {
		return
	}
	const newActivity: NewActivityLog = {
		workspaceId,
		userId,
		action: type,
		ipAddress: ipAddress || '',
	}
	await db.insert(activityLogs).values(newActivity)
}

export async function signInWithOAuth(inviteId?: string | null) {
	const { Google } = await import('arctic')
	const origin = (await headers()).get('origin')

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		throw new Error('Google OAuth is not configured')
	}

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

	const userWithWorkspace = await getUserWithWorkspace(user.id)

	await Promise.all([logActivity(userWithWorkspace?.workspaceId, user.id, ActivityType.SIGN_IN)])

	await createSession(user.id)

	const redirectTo = formData.get('redirect') as string | null
	if (redirectTo === 'checkout') {
		const priceId = formData.get('priceId') as string
		const workspace = userWithWorkspace?.workspaceId
			? (
					await db
						.select()
						.from(workspaces)
						.where(eq(workspaces.id, userWithWorkspace.workspaceId))
						.limit(1)
				)[0]
			: null
		return createCheckoutSession({ workspace: workspace ?? null, priceId })
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

	let workspaceId: string
	let userRole: string
	let createdWorkspace: typeof workspaces.$inferSelect | null = null

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
			workspaceId = invitation.workspaceId
			userRole = invitation.role

			await db
				.update(invitations)
				.set({ status: 'accepted' })
				.where(eq(invitations.id, invitation.id))
			await db.update(publicUsers).set({ role: userRole }).where(eq(publicUsers.id, createdUser.id))

			await logActivity(workspaceId, createdUser.id, ActivityType.ACCEPT_INVITATION)

			;[createdWorkspace] = await db
				.select()
				.from(workspaces)
				.where(eq(workspaces.id, workspaceId))
				.limit(1)
		} else {
			return { error: 'Invalid or expired invitation.' }
		}
	} else {
		const newWorkspace: NewWorkspace = {
			name: `${email}'s Workspace`,
		}

		;[createdWorkspace] = await db.insert(workspaces).values(newWorkspace).returning()

		if (!createdWorkspace) {
			return { error: 'Failed to create workspace. Please try again.' }
		}

		workspaceId = createdWorkspace.id
		userRole = 'owner'

		await logActivity(workspaceId, createdUser.id, ActivityType.CREATE_WORKSPACE)
	}

	const newWorkspaceMember: NewWorkspaceMember = {
		userId: createdUser.id,
		workspaceId,
		role: userRole,
	}

	await Promise.all([
		db.insert(workspaceMembers).values(newWorkspaceMember),
		logActivity(workspaceId, createdUser.id, ActivityType.SIGN_UP),
	])

	await createSession(createdUser.id)

	const redirectTo = formData.get('redirect') as string | null
	if (redirectTo === 'checkout') {
		const priceId = formData.get('priceId') as string
		return createCheckoutSession({ workspace: createdWorkspace, priceId })
	}

	redirect('/dashboard')
})

export async function signOut() {
	const user = await getUser()

	if (user) {
		const userWithWorkspace = await getUserWithWorkspace(user.id)
		if (userWithWorkspace) {
			await logActivity(userWithWorkspace.workspaceId, user.id, ActivityType.SIGN_OUT)
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

		const userWithWorkspace = await getUserWithWorkspace(user.id)
		await logActivity(userWithWorkspace?.workspaceId, user.id, ActivityType.UPDATE_PASSWORD)

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

	const userWithWorkspace = await getUserWithWorkspace(user.id)

	await logActivity(userWithWorkspace?.workspaceId, user.id, ActivityType.DELETE_ACCOUNT)

	await db
		.update(publicUsers)
		.set({
			deletedAt: sql`CURRENT_TIMESTAMP`,
			name: sql`CONCAT(name, '-', id, '-deleted')`,
			email: sql`CONCAT(email, '-', id, '-deleted')`,
		})
		.where(eq(publicUsers.id, user.id))

	if (userWithWorkspace?.workspaceId) {
		await db
			.delete(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.userId, user.id),
					eq(workspaceMembers.workspaceId, userWithWorkspace.workspaceId),
				),
			)
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
	const userWithWorkspace = await getUserWithWorkspace(user.id)

	await Promise.all([
		db.update(publicUsers).set({ name, email }).where(eq(publicUsers.id, user.id)),
		logActivity(userWithWorkspace?.workspaceId, user.id, ActivityType.UPDATE_ACCOUNT),
	])

	return { success: 'Account updated successfully.' }
})

const removeWorkspaceMemberSchema = z.object({
	memberId: z.number(),
})

export const removeWorkspaceMember = validatedActionWithUser(
	removeWorkspaceMemberSchema,
	async (data, _, user) => {
		const { memberId } = data
		const userWithWorkspace = await getUserWithWorkspace(user.id)

		if (!userWithWorkspace?.workspaceId) {
			return { error: 'User is not part of a workspace' }
		}

		await db
			.delete(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.id, memberId),
					eq(workspaceMembers.workspaceId, userWithWorkspace.workspaceId),
				),
			)

		await logActivity(userWithWorkspace.workspaceId, user.id, ActivityType.REMOVE_WORKSPACE_MEMBER)

		return { success: 'Workspace member removed successfully' }
	},
)

const inviteWorkspaceMemberSchema = z.object({
	email: z.string().email('Invalid email address'),
	role: z.enum(['member', 'owner']),
})

export const inviteWorkspaceMember = validatedActionWithUser(
	inviteWorkspaceMemberSchema,
	async (data, _, user) => {
		const { email, role } = data
		const userWithWorkspace = await getUserWithWorkspace(user.id)

		if (!userWithWorkspace?.workspaceId) {
			return { error: 'User is not part of a workspace' }
		}

		const existingMember = await db
			.select()
			.from(publicUsers)
			.leftJoin(workspaceMembers, eq(publicUsers.id, workspaceMembers.userId))
			.where(
				and(
					eq(publicUsers.email, email),
					eq(workspaceMembers.workspaceId, userWithWorkspace.workspaceId),
				),
			)
			.limit(1)

		if (existingMember.length > 0) {
			return { error: 'User is already a member of this workspace' }
		}

		const existingInvitation = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.email, email),
					eq(invitations.workspaceId, userWithWorkspace.workspaceId),
					eq(invitations.status, 'pending'),
				),
			)
			.limit(1)

		if (existingInvitation.length > 0) {
			return { error: 'An invitation has already been sent to this email' }
		}

		await db.insert(invitations).values({
			workspaceId: userWithWorkspace.workspaceId,
			email,
			role,
			invitedBy: user.id,
			status: 'pending',
		})

		await logActivity(userWithWorkspace.workspaceId, user.id, ActivityType.INVITE_WORKSPACE_MEMBER)

		// TODO: Send invitation email and include ?inviteId={id} to sign-up URL

		return { success: 'Invitation sent successfully' }
	},
)
