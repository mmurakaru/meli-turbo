'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getTeamForUser } from '@/lib/db/queries'
import { ActivityType, documents } from '@/lib/db/schema'
import { logActivity } from '../(login)/actions'

const createDocumentSchema = z.object({
	title: z.string().max(100),
	description: z.string().optional().default(''),
	owner: z.string(),
	columns: z.string().optional(),
	rows: z.string().optional(),
})

export const createDocument = validatedActionWithUser(createDocumentSchema, async (data, _, user) => {
	const { title, description, owner } = data

	const team = await getTeam(user.id)

	if (!team) {
		return { error: 'User is not authorized to create document' }
	}

	const ownerId = owner === 'team' ? team.id : user.id
	const ownerType = owner === 'team' ? 'team' : 'user'

	const columns = data.columns ? JSON.parse(data.columns) : []
	const rows = data.rows ? JSON.parse(data.rows) : []

	const [newDocument] = await db
		.insert(documents)
		.values({
			title,
			description,
			ownerType: ownerType,
			ownerId: ownerId,
			data: { columns, rows },
		})
		.returning()

	if (!newDocument) {
		return { error: 'Failed to create Document. Please try again.' }
	}

	await logActivity(team.id, user.id, ActivityType.CREATE_DOCUMENT)

	redirect(`/dashboard/documents/${newDocument.id}`)
})

const updateDocumentSchema = z.object({
	tourId: z.number(),
	title: z.string().max(100),
	description: z.string(),
})

export const updateDocument = validatedActionWithUser(updateDocumentSchema, async (data, _) => {
	const { title: _title, description: _description, tourId: _tourId } = data
	// TODO: Implement document update logic
})

export const getTeam = async (userId: string) => {
	return getTeamForUser(userId)
}
