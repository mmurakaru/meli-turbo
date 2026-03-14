import 'server-only'

import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { env } from '@/env'

export type SessionPayload = {
	userId: string
	expiresAt: Date
}

const encodedKey = new TextEncoder().encode(env.SESSION_SECRET)

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export async function encrypt(payload: SessionPayload) {
	return new SignJWT({ userId: payload.userId, expiresAt: payload.expiresAt.toISOString() })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
	try {
		const { payload } = await jwtVerify(session, encodedKey, {
			algorithms: ['HS256'],
		})
		return payload as { userId: string; expiresAt: string }
	} catch {
		return null
	}
}

export async function createSession(userId: string) {
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
	const session = await encrypt({ userId, expiresAt })
	const cookieStore = await cookies()

	cookieStore.set('session', session, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		expires: expiresAt,
		sameSite: 'lax',
		path: '/',
	})
}

export async function updateSession() {
	const cookieStore = await cookies()
	const session = cookieStore.get('session')?.value
	const payload = await decrypt(session)

	if (!session || !payload) {
		return null
	}

	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
	cookieStore.set('session', session, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		expires: expiresAt,
		sameSite: 'lax',
		path: '/',
	})
}

export async function deleteSession() {
	const cookieStore = await cookies()
	cookieStore.delete('session')
}

export async function setActiveWorkspaceId(workspaceId: string) {
	const cookieStore = await cookies()
	cookieStore.set('active_workspace', workspaceId, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
	})
}
