'use server'

import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getTeamForUser, getUserWithTeam } from '@/lib/db/queries'
import { ActivityType, documents, modules, steps } from '@/lib/db/schema'
import { logActivity } from '../(login)/actions'

const createDocumentSchema = z.object({
	title: z.string().max(100),
	description: z.string(),
	owner: z.string(),
})

export const createDocument = validatedActionWithUser(createDocumentSchema, async (data, _, user) => {
	const { title, description, owner } = data

	const team = await getTeam(user.id)

	if (!team) {
		return { error: 'User is not authorized to create document' }
	}

	const ownerId = owner === 'team' ? team.id : user.id
	const ownerType = owner === 'team' ? 'team' : 'user'

	const [newDocument] = await db
		.insert(documents)
		.values({
			title,
			description,
			ownerType: ownerType,
			ownerId: ownerId,
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

const createStepSchema = z.object({
	moduleId: z.number(),
	selector: z.string().max(100),
	title: z.string().max(100),
	text: z.string(),
})

export const createStep = validatedActionWithUser(createStepSchema, async (data, _, user) => {
	const { moduleId, selector, title, text } = data

	const [module] = await db
		.select({ tourId: modules.tourId })
		.from(modules)
		.where(eq(modules.id, moduleId))
		.limit(1)

	if (!module) {
		return { error: 'Module not found' }
	}

	const [tour] = await db
		.select({ teamId: documents.ownerId })
		.from(documents)
		.where(eq(documents.id, module.tourId))
		.limit(1)

	if (!tour) {
		return { error: 'Document not found' }
	}

	const userWithTeam = await getUserWithTeam(user.id)
	if (!userWithTeam || userWithTeam.teamId !== tour.teamId) {
		return { error: 'User is not authorized to create steps for this tour' }
	}

	// Get the highest order number for steps in the module
	const [highestOrder] = await db
		.select({ maxOrder: sql<number>`MAX(${steps.order})` })
		.from(steps)
		.where(eq(steps.moduleId, moduleId))

	const nextOrder = (highestOrder?.maxOrder || 0) + 1

	const [newStep] = await db
		.insert(steps)
		.values({
			moduleId,
			selector,
			title,
			text,
			order: nextOrder,
		})
		.returning()

	if (!newStep) {
		return { error: 'Failed to create step. Please try again.' }
	}

	await logActivity(tour.teamId, user.id, ActivityType.CREATE_STEP)

	return { success: 'Step created successfully', step: newStep }
})

export const getTeam = async (userId: string) => {
	return getTeamForUser(userId)
}
