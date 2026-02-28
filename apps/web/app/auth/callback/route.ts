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
	type NewTeam,
	type NewTeamMember,
	type NewUser,
	publicUsers,
	teamMembers,
	teams,
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
			const userWithTeam = await db
				.select({ teamId: teamMembers.teamId })
				.from(teamMembers)
				.where(eq(teamMembers.userId, userId))
				.limit(1)

			await logActivity(userWithTeam[0]?.teamId, userId, ActivityType.SIGN_IN)
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
			let teamId: string

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
					teamId = invitation.teamId
					await db
						.update(invitations)
						.set({ status: 'accepted' })
						.where(eq(invitations.id, invitation.id))
					await db
						.update(publicUsers)
						.set({ role: invitation.role })
						.where(eq(publicUsers.id, userId))
					await logActivity(teamId, userId, ActivityType.ACCEPT_INVITATION)
				} else {
					return NextResponse.redirect(`${origin}/auth/auth-code-error`)
				}
			} else {
				const newTeam: NewTeam = { name: `${googleUser.email}'s Team` }
				const [createdTeam] = await db.insert(teams).values(newTeam).returning()
				if (!createdTeam) {
					return NextResponse.redirect(`${origin}/auth/auth-code-error`)
				}
				teamId = createdTeam.id
				await logActivity(teamId, userId, ActivityType.CREATE_TEAM)
			}

			const newTeamMember: NewTeamMember = { userId, teamId, role: 'owner' }
			await Promise.all([
				db.insert(teamMembers).values(newTeamMember),
				logActivity(teamId, userId, ActivityType.SIGN_UP),
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
