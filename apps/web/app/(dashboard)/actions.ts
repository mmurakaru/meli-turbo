'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { setActiveWorkspaceId } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { getUserWithWorkspace, getWorkspacesForUser } from '@/lib/db/queries'
import {
	ActivityType,
	activityLogs,
	documents,
	documentVersions,
	invitations,
	publicUsers,
	workspaceMembers,
	workspaces,
} from '@/lib/db/schema'
import { logActivity } from '../(login)/actions'

const createDocumentSchema = z.object({
	id: z.string().uuid(),
	title: z.string().max(100),
	description: z.string().optional().default(''),
	workspaceId: z.uuid().optional(),
	createMore: z.string().optional(),
	columns: z.string().optional(),
	rows: z.string().optional(),
})

export const createDocument = validatedActionWithUser(
	createDocumentSchema,
	async (data, _, user) => {
		const { id, title, description, workspaceId, createMore } = data

		const ownerId = workspaceId ? workspaceId : user.id
		const ownerType = workspaceId ? 'workspace' : 'user'

		const columns = data.columns ? JSON.parse(data.columns) : []
		const rows = data.rows ? JSON.parse(data.rows) : []

		const [newDocument] = await db
			.insert(documents)
			.values({
				id,
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

		if (createMore === 'true') {
			return { success: 'Spreadsheet created.' }
		}

		redirect(`/document/${newDocument.id}`)
	},
)

const updateDocumentSchema = z.object({
	documentId: z.uuid(),
	title: z.string().max(100).optional(),
	description: z.string().optional(),
	columns: z.string().optional(),
	rows: z.string().optional(),
})

export const updateDocument = validatedActionWithUser(
	updateDocumentSchema,
	async (data, _, user) => {
		const { documentId, title, description, columns, rows } = data

		const [existing] = await db
			.select()
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1)

		if (!existing) {
			return { error: 'Document not found' }
		}

		const userWithWorkspace = await getUserWithWorkspace(user.id)
		const hasPermission =
			(existing.ownerId === user.id && existing.ownerType === 'user') ||
			(existing.ownerType === 'workspace' && userWithWorkspace?.workspaceId === existing.ownerId)

		if (!hasPermission) {
			return { error: 'Unauthorized' }
		}

		const newData =
			columns && rows
				? {
						columns: JSON.parse(columns) as { id: string; label: string }[],
						rows: JSON.parse(rows) as Record<string, string>[],
					}
				: existing.data

		await db
			.update(documents)
			.set({
				title: title ?? existing.title,
				description: description ?? existing.description,
				data: newData,
				updatedAt: new Date(),
			})
			.where(eq(documents.id, documentId))

		revalidatePath(`/document/${documentId}`)
		return { success: 'Saved' }
	},
)

const createWorkspaceSchema = z.object({
	name: z.string().min(1).max(100),
})

export const createWorkspace = validatedActionWithUser(
	createWorkspaceSchema,
	async (data, _, user) => {
		const { name } = data

		const [newWorkspace] = await db.insert(workspaces).values({ id: uuidv7(), name }).returning()

		if (!newWorkspace) {
			return { error: 'Failed to create workspace. Please try again.' }
		}

		await db.insert(workspaceMembers).values({
			userId: user.id,
			workspaceId: newWorkspace.id,
			role: 'owner',
		})

		await logActivity(newWorkspace.id, user.id, ActivityType.CREATE_WORKSPACE)
		await setActiveWorkspaceId(newWorkspace.id)
		revalidatePath('/', 'layout')

		redirect(`/workspace/${newWorkspace.id}`)
	},
)

const deleteWorkspaceSchema = z.object({
	workspaceId: z.string().uuid(),
})

export const deleteWorkspace = validatedActionWithUser(
	deleteWorkspaceSchema,
	async (data, _, user) => {
		const { workspaceId } = data

		const [membership] = await db
			.select()
			.from(workspaceMembers)
			.where(
				and(eq(workspaceMembers.userId, user.id), eq(workspaceMembers.workspaceId, workspaceId)),
			)
			.limit(1)

		if (!membership || membership.role !== 'owner') {
			return { error: 'Only the workspace owner can delete this workspace' }
		}

		await db
			.delete(documents)
			.where(and(eq(documents.ownerId, workspaceId), eq(documents.ownerType, 'workspace')))
		await db.delete(invitations).where(eq(invitations.workspaceId, workspaceId))
		await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId))
		await db.delete(activityLogs).where(eq(activityLogs.workspaceId, workspaceId))
		await db.delete(workspaces).where(eq(workspaces.id, workspaceId))

		revalidatePath('/', 'layout')
		redirect('/dashboard')
	},
)

export const switchWorkspace = async (workspaceId: string) => {
	await setActiveWorkspaceId(workspaceId)
	revalidatePath('/', 'layout')
	redirect('/dashboard')
}

const inviteMemberSchema = z.object({
	workspaceId: z.string().uuid(),
	email: z.string().email(),
	role: z.enum(['admin', 'editor', 'viewer']),
})

export const inviteMember = validatedActionWithUser(inviteMemberSchema, async (data, _, user) => {
	const { workspaceId, email, role } = data

	const [membership] = await db
		.select()
		.from(workspaceMembers)
		.where(and(eq(workspaceMembers.userId, user.id), eq(workspaceMembers.workspaceId, workspaceId)))
		.limit(1)

	if (!membership) {
		return { error: 'Not authorized' }
	}

	const [existingMember] = await db
		.select()
		.from(publicUsers)
		.leftJoin(workspaceMembers, eq(publicUsers.id, workspaceMembers.userId))
		.where(and(eq(publicUsers.email, email), eq(workspaceMembers.workspaceId, workspaceId)))
		.limit(1)

	if (existingMember) {
		return { error: 'User is already a member of this workspace' }
	}

	const [existingInvitation] = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.email, email),
				eq(invitations.workspaceId, workspaceId),
				eq(invitations.status, 'pending'),
			),
		)
		.limit(1)

	if (existingInvitation) {
		return { error: 'An invitation has already been sent to this email' }
	}

	await db
		.insert(invitations)
		.values({ workspaceId, email, role, invitedBy: user.id, status: 'pending' })
	await logActivity(workspaceId, user.id, ActivityType.INVITE_WORKSPACE_MEMBER)
	revalidatePath(`/workspace/${workspaceId}/members`)

	return { success: 'Invitation sent successfully' }
})

export const getWorkspace = async (userId: string) => getWorkspacesForUser(userId)

const MAXIMUM_VERSIONS_PER_DOCUMENT = 50

const createDocumentVersionSchema = z.object({
	documentId: z.uuid(),
	label: z.string().optional(),
})

export const createDocumentVersion = validatedActionWithUser(
	createDocumentVersionSchema,
	async (data, _, user) => {
		const { documentId, label } = data

		const [existingDocument] = await db
			.select()
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1)

		if (!existingDocument) return { error: 'Document not found' }

		const userWithWorkspace = await getUserWithWorkspace(user.id)
		const hasPermission =
			(existingDocument.ownerId === user.id && existingDocument.ownerType === 'user') ||
			(existingDocument.ownerType === 'workspace' &&
				userWithWorkspace?.workspaceId === existingDocument.ownerId)

		if (!hasPermission) return { error: 'Unauthorized' }

		const [latestVersion] = await db
			.select({ version: documentVersions.version })
			.from(documentVersions)
			.where(eq(documentVersions.documentId, documentId))
			.orderBy(desc(documentVersions.version))
			.limit(1)

		const nextVersionNumber = (latestVersion?.version ?? 0) + 1

		await db.insert(documentVersions).values({
			documentId,
			version: nextVersionNumber,
			data: existingDocument.data,
			createdBy: user.id,
			label: label ?? `Version ${nextVersionNumber}`,
		})

		// Prune versions beyond the maximum allowed
		const versionsToDelete = await db
			.select({ id: documentVersions.id })
			.from(documentVersions)
			.where(eq(documentVersions.documentId, documentId))
			.orderBy(desc(documentVersions.version))
			.offset(MAXIMUM_VERSIONS_PER_DOCUMENT)

		if (versionsToDelete.length > 0) {
			for (const versionToDelete of versionsToDelete) {
				await db.delete(documentVersions).where(eq(documentVersions.id, versionToDelete.id))
			}
		}

		return { success: 'Version saved' }
	},
)

const restoreDocumentVersionSchema = z.object({
	documentId: z.uuid(),
	versionId: z.uuid(),
})

export const restoreDocumentVersion = validatedActionWithUser(
	restoreDocumentVersionSchema,
	async (data, _, user) => {
		const { documentId, versionId } = data

		const [existingDocument] = await db
			.select()
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1)

		if (!existingDocument) return { error: 'Document not found' }

		const userWithWorkspace = await getUserWithWorkspace(user.id)
		const hasPermission =
			(existingDocument.ownerId === user.id && existingDocument.ownerType === 'user') ||
			(existingDocument.ownerType === 'workspace' &&
				userWithWorkspace?.workspaceId === existingDocument.ownerId)

		if (!hasPermission) return { error: 'Unauthorized' }

		const [versionToRestore] = await db
			.select()
			.from(documentVersions)
			.where(and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, documentId)))
			.limit(1)

		if (!versionToRestore) return { error: 'Version not found' }

		// Snapshot current state before restoring
		const [latestVersion] = await db
			.select({ version: documentVersions.version })
			.from(documentVersions)
			.where(eq(documentVersions.documentId, documentId))
			.orderBy(desc(documentVersions.version))
			.limit(1)

		await db.insert(documentVersions).values({
			documentId,
			version: (latestVersion?.version ?? 0) + 1,
			data: existingDocument.data,
			createdBy: user.id,
			label: 'Before restore',
		})

		await db
			.update(documents)
			.set({ data: versionToRestore.data, updatedAt: new Date() })
			.where(eq(documents.id, documentId))

		revalidatePath(`/document/${documentId}`)
		return { success: 'Document restored' }
	},
)
