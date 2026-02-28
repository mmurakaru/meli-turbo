import 'server-only'

import { and, eq, isNull } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from '@/lib/db/drizzle'
import { publicUsers } from '@/lib/db/schema'
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
