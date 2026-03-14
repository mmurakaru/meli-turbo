import { relations } from 'drizzle-orm'
import {
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

export const publicUsers = pgTable('profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 100 }),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: text('password_hash'),
	role: varchar('role', { length: 20 }).notNull().default('member'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at'),
})

export const workspaces = pgTable('workspaces', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 100 }).notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	stripeCustomerId: text('stripe_customer_id').unique(),
	stripeSubscriptionId: text('stripe_subscription_id').unique(),
	stripeProductId: text('stripe_product_id'),
	planName: varchar('plan_name', { length: 50 }),
	subscriptionStatus: varchar('subscription_status', { length: 20 }),
})

export const workspaceMembers = pgTable('workspace_members', {
	id: serial('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => publicUsers.id, { onDelete: 'cascade' }),
	workspaceId: uuid('workspace_id')
		.notNull()
		.references(() => workspaces.id),
	role: varchar('role', { length: 50 }).notNull(),
	joinedAt: timestamp('joined_at').notNull().defaultNow(),
})

export const activityLogs = pgTable('activity_logs', {
	id: serial('id').primaryKey(),
	workspaceId: uuid('workspace_id')
		.notNull()
		.references(() => workspaces.id),
	userId: uuid('user_id').references(() => publicUsers.id),
	action: text('action').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
	ipAddress: varchar('ip_address', { length: 45 }),
})

export const invitations = pgTable('invitations', {
	id: serial('id').primaryKey(),
	workspaceId: uuid('workspace_id')
		.notNull()
		.references(() => workspaces.id),
	email: varchar('email', { length: 255 }).notNull(),
	role: varchar('role', { length: 50 }).notNull(),
	invitedBy: uuid('invited_by')
		.notNull()
		.references(() => publicUsers.id, { onDelete: 'cascade' }),
	invitedAt: timestamp('invited_at').notNull().defaultNow(),
	status: varchar('status', { length: 20 }).notNull().default('pending'),
})

export const ownerTypeEnum = pgEnum('owner_type', ['workspace', 'user'])

export const documents = pgTable('documents', {
	id: uuid('id').primaryKey(),
	ownerId: uuid('owner_id').notNull(),
	ownerType: ownerTypeEnum('owner_type').notNull(),
	title: varchar('title', { length: 100 }).notNull(),
	description: text('description').notNull(),
	data: jsonb('data').$type<{ columns: { id: string; label: string }[]; rows: Record<string, string>[] }>().notNull().default({ columns: [], rows: [] }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at'),
})

export const workspacesRelations = relations(workspaces, ({ many }) => ({
	workspaceMembers: many(workspaceMembers),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
}))

export const usersRelations = relations(publicUsers, ({ many }) => ({
	workspaceMembers: many(workspaceMembers),
	invitationsSent: many(invitations),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [invitations.workspaceId],
		references: [workspaces.id],
	}),
	invitedBy: one(publicUsers, {
		fields: [invitations.invitedBy],
		references: [publicUsers.id],
	}),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
	user: one(publicUsers, {
		fields: [workspaceMembers.userId],
		references: [publicUsers.id],
	}),
	workspace: one(workspaces, {
		fields: [workspaceMembers.workspaceId],
		references: [workspaces.id],
	}),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [activityLogs.workspaceId],
		references: [workspaces.id],
	}),
	user: one(publicUsers, {
		fields: [activityLogs.userId],
		references: [publicUsers.id],
	}),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [documents.ownerId],
		references: [workspaces.id],
		relationName: 'workspaceDocuments',
	}),
	user: one(publicUsers, {
		fields: [documents.ownerId],
		references: [publicUsers.id],
		relationName: 'userDocuments',
	}),
}))

export type User = typeof publicUsers.$inferSelect
export type NewUser = typeof publicUsers.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
export type WorkspaceDataWithMembers = Workspace & {
	workspaceMembers: (WorkspaceMember & {
		user: Pick<User, 'id' | 'name' | 'email'>
	})[]
}
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type DocumentWithWorkspace = Document & {
	workspace: Pick<Workspace, 'id' | 'name'>
}
export type OwnerType = 'workspace' | 'user'

export enum ActivityType {
	SIGN_UP = 'SIGN_UP',
	SIGN_IN = 'SIGN_IN',
	SIGN_OUT = 'SIGN_OUT',
	UPDATE_PASSWORD = 'UPDATE_PASSWORD',
	DELETE_ACCOUNT = 'DELETE_ACCOUNT',
	UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
	CREATE_WORKSPACE = 'CREATE_WORKSPACE',
	REMOVE_WORKSPACE_MEMBER = 'REMOVE_WORKSPACE_MEMBER',
	INVITE_WORKSPACE_MEMBER = 'INVITE_WORKSPACE_MEMBER',
	ACCEPT_INVITATION = 'ACCEPT_INVITATION',
	CREATE_DOCUMENT = 'CREATE_DOCUMENT',
}
