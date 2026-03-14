import { relations } from 'drizzle-orm'
import {
	integer,
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

export const teams = pgTable('teams', {
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

export const teamMembers = pgTable('team_members', {
	id: serial('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => publicUsers.id, { onDelete: 'cascade' }),
	teamId: uuid('team_id')
		.notNull()
		.references(() => teams.id),
	role: varchar('role', { length: 50 }).notNull(),
	joinedAt: timestamp('joined_at').notNull().defaultNow(),
})

export const activityLogs = pgTable('activity_logs', {
	id: serial('id').primaryKey(),
	teamId: uuid('team_id')
		.notNull()
		.references(() => teams.id),
	userId: uuid('user_id').references(() => publicUsers.id),
	action: text('action').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
	ipAddress: varchar('ip_address', { length: 45 }),
})

export const invitations = pgTable('invitations', {
	id: serial('id').primaryKey(),
	teamId: uuid('team_id')
		.notNull()
		.references(() => teams.id),
	email: varchar('email', { length: 255 }).notNull(),
	role: varchar('role', { length: 50 }).notNull(),
	invitedBy: uuid('invited_by')
		.notNull()
		.references(() => publicUsers.id, { onDelete: 'cascade' }),
	invitedAt: timestamp('invited_at').notNull().defaultNow(),
	status: varchar('status', { length: 20 }).notNull().default('pending'),
})

export const ownerTypeEnum = pgEnum('owner_type', ['team', 'user'])

export const documents = pgTable('documents', {
	id: serial('id').primaryKey(),
	ownerId: uuid('owner_id').notNull(),
	ownerType: ownerTypeEnum('owner_type').notNull(),
	title: varchar('title', { length: 100 }).notNull(),
	description: text('description').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at'),
})

export const modules = pgTable('modules', {
	id: serial('id').primaryKey(),
	tourId: integer('tour_id')
		.notNull()
		.references(() => documents.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 100 }).notNull(),
	order: integer('order').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const steps = pgTable('steps', {
	id: serial('id').primaryKey(),
	moduleId: integer('module_id')
		.notNull()
		.references(() => modules.id, { onDelete: 'cascade' }),
	selector: varchar('selector', { length: 255 }).notNull(),
	title: varchar('title', { length: 100 }).notNull(),
	text: text('text').notNull(),
	order: integer('order').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const teamsRelations = relations(teams, ({ many }) => ({
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
}))

export const usersRelations = relations(publicUsers, ({ many }) => ({
	teamMembers: many(teamMembers),
	invitationsSent: many(invitations),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id],
	}),
	invitedBy: one(publicUsers, {
		fields: [invitations.invitedBy],
		references: [publicUsers.id],
	}),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	user: one(publicUsers, {
		fields: [teamMembers.userId],
		references: [publicUsers.id],
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id],
	}),
	user: one(publicUsers, {
		fields: [activityLogs.userId],
		references: [publicUsers.id],
	}),
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
	team: one(teams, {
		fields: [documents.ownerId],
		references: [teams.id],
		relationName: 'teamDocuments',
	}),
	user: one(publicUsers, {
		fields: [documents.ownerId],
		references: [publicUsers.id],
		relationName: 'userDocuments',
	}),
	steps: many(steps),
}))

export const modulesRelations = relations(modules, ({ one }) => ({
	tour: one(documents, {
		fields: [modules.tourId],
		references: [documents.id],
	}),
}))

export const stepsRelations = relations(steps, ({ one }) => ({
	module: one(modules, {
		fields: [steps.moduleId],
		references: [modules.id],
	}),
}))

export type User = typeof publicUsers.$inferSelect
export type NewUser = typeof publicUsers.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
export type TeamDataWithMembers = Team & {
	teamMembers: (TeamMember & {
		user: Pick<User, 'id' | 'name' | 'email'>
	})[]
}
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type DocumentWithTeam = Document & {
	team: Pick<Team, 'id' | 'name'>
}
export type OwnerType = 'team' | 'user'
export type Module = typeof modules.$inferSelect
export type NewModule = typeof steps.$inferInsert
export type DocumentWithModules = Document & {
	modules: (Module & {
		steps: Step[]
	})[]
}
export type Step = typeof steps.$inferSelect
export type NewStep = typeof steps.$inferInsert
export type ModuleWithSteps = Module & {
	steps: Step[]
}

export enum ActivityType {
	SIGN_UP = 'SIGN_UP',
	SIGN_IN = 'SIGN_IN',
	SIGN_OUT = 'SIGN_OUT',
	UPDATE_PASSWORD = 'UPDATE_PASSWORD',
	DELETE_ACCOUNT = 'DELETE_ACCOUNT',
	UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
	CREATE_TEAM = 'CREATE_TEAM',
	REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
	INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
	ACCEPT_INVITATION = 'ACCEPT_INVITATION',
	CREATE_DOCUMENT = 'CREATE_DOCUMENT',
	CREATE_MODULE = 'CREATE_MODULE',
	CREATE_STEP = 'CREATE_STEP',
}
