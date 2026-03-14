'use server'

import { redirect } from 'next/navigation'
import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getWorkspacesForUser } from '@/lib/db/queries'
import { ActivityType, documents } from '@/lib/db/schema'
import { logActivity } from '../(login)/actions'

const createDocumentSchema = z.object({
	title: z.string().max(100),
	description: z.string().optional().default(''),
	workspaceId: z.string().uuid().optional(),
	columns: z.string().optional(),
	rows: z.string().optional(),
})

export const createDocument = validatedActionWithUser(
	createDocumentSchema,
	async (data, _, user) => {
		const { title, description, workspaceId } = data

		const ownerId = workspaceId ? workspaceId : user.id
		const ownerType = workspaceId ? 'workspace' : 'user'

		const columns = data.columns ? JSON.parse(data.columns) : []
		const rows = data.rows ? JSON.parse(data.rows) : []

		const [newDocument] = await db
			.insert(documents)
			.values({
				id: uuidv7(),
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

		await logActivity(workspaceId ?? null, user.id, ActivityType.CREATE_DOCUMENT)

		redirect(`/document/${newDocument.id}`)
	},
)

const updateDocumentSchema = z.object({
	documentId: z.uuid(),
	title: z.string().max(100),
	description: z.string(),
})

export const updateDocument = validatedActionWithUser(updateDocumentSchema, async (data, _) => {
	const { title: _title, description: _description, documentId: _documentId } = data
	// TODO: Implement document update logic
})

export const getWorkspace = async (userId: string) => getWorkspacesForUser(userId)
