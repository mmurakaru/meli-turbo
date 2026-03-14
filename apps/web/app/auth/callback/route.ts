import { Google } from 'arctic'
import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logActivity } from '@/app/(login)/actions'
import { env } from '@/env'
import { createSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import {
	ActivityType,
	invitations,
	type NewWorkspace,
	type NewWorkspaceMember,
	type NewUser,
	publicUsers,
	workspaceMembers,
	workspaces,
} from '@/lib/db/schema'

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get('code')
	const state = searchParams.get('state')
	const next = searchParams.get('next') ?? '/dashboard'
	const inviteId = searchParams.get('inviteId')

	const cookieStore = await cookies()
	const storedState = cookieStore.get('oauth_state')?.value
	const codeVerifier = cookieStore.get('oauth_code_verifier')?.value

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		return NextResponse.redirect(`${origin}/auth/auth-code-error`)
	}

	cookieStore.delete('oauth_state')
	cookieStore.delete('oauth_code_verifier')

	try {
		const google = new Google(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			`${origin}/auth/callback`,
		)

		const tokens = await google.validateAuthorizationCode(code, codeVerifier)
		const accessToken = tokens.accessToken()

		const googleUserRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
		const googleUser = (await googleUserRes.json()) as {
			sub: string
			email: string
			name?: string
			picture?: string
		}

		if (!googleUser.email) {
			return NextResponse.redirect(`${origin}/auth/auth-code-error`)
		}

		const existingUser = await db
			.select()
			.from(publicUsers)
			.where(eq(publicUsers.email, googleUser.email))
			.limit(1)

		let userId: string

		if (existingUser.length) {
			userId = existingUser[0].id
			const userWithWorkspace = await db
				.select({ workspaceId: workspaceMembers.workspaceId })
				.from(workspaceMembers)
				.where(eq(workspaceMembers.userId, userId))
				.limit(1)

			await logActivity(userWithWorkspace[0]?.workspaceId, userId, ActivityType.SIGN_IN)
		} else {
			const newUser: NewUser = {
				email: googleUser.email,
				name: googleUser.name ?? null,
				role: 'owner',
			}

			const [createdUser] = await db.insert(publicUsers).values(newUser).returning()
			if (!createdUser) {
				return NextResponse.redirect(`${origin}/auth/auth-code-error`)
			}

			userId = createdUser.id
			let workspaceId: string

			if (inviteId) {
				const [invitation] = await db
					.select()
					.from(invitations)
					.where(
						and(
							eq(invitations.id, parseInt(inviteId, 10)),
							eq(invitations.email, googleUser.email),
							eq(invitations.status, 'pending'),
						),
					)
					.limit(1)

				if (invitation) {
					workspaceId = invitation.workspaceId
					await db
						.update(invitations)
						.set({ status: 'accepted' })
						.where(eq(invitations.id, invitation.id))
					await db
						.update(publicUsers)
						.set({ role: invitation.role })
						.where(eq(publicUsers.id, userId))
					await logActivity(workspaceId, userId, ActivityType.ACCEPT_INVITATION)
				} else {
					return NextResponse.redirect(`${origin}/auth/auth-code-error`)
				}
			} else {
				const newWorkspace: NewWorkspace = { name: `${googleUser.email}'s Workspace` }
				const [createdWorkspace] = await db.insert(workspaces).values(newWorkspace).returning()
				if (!createdWorkspace) {
					return NextResponse.redirect(`${origin}/auth/auth-code-error`)
				}
				workspaceId = createdWorkspace.id
				await logActivity(workspaceId, userId, ActivityType.CREATE_WORKSPACE)
			}

			const newWorkspaceMember: NewWorkspaceMember = { userId, workspaceId, role: 'owner' }
			await Promise.all([
				db.insert(workspaceMembers).values(newWorkspaceMember),
				logActivity(workspaceId, userId, ActivityType.SIGN_UP),
			])
		}

		await createSession(userId)

		const forwardedHost = request.headers.get('x-forwarded-host')
		const isLocalEnv = process.env.NODE_ENV === 'development'

		if (isLocalEnv) {
			return NextResponse.redirect(`${origin}${next}`)
		} else if (forwardedHost) {
			return NextResponse.redirect(`https://${forwardedHost}${next}`)
		} else {
			return NextResponse.redirect(`${origin}${next}`)
		}
	} catch {
		return NextResponse.redirect(`${origin}/auth/auth-code-error`)
	}
}
