import { loadEnvConfig } from '@next/env'
import { eq } from 'drizzle-orm'

loadEnvConfig(process.cwd())

async function seed() {
	const bcrypt = await import('bcryptjs')
	const { db } = await import('./drizzle')
	const { publicUsers, teamMembers, teams } = await import('./schema')

	const email = 'test@test.com'
	const password = 'admin123'

	const existing = await db.select().from(publicUsers).where(eq(publicUsers.email, email)).limit(1)
	if (existing.length > 0) {
		console.log('Seed user already exists, skipping.')
		return
	}

	const passwordHash = await bcrypt.hash(password, 12)

	const [publicUser] = await db
		.insert(publicUsers)
		.values({
			name: 'Test User',
			email,
			passwordHash,
			role: 'owner',
		})
		.returning()

	console.log('User created.')

	const [team] = await db
		.insert(teams)
		.values({
			name: 'Test Team',
		})
		.returning()

	await db.insert(teamMembers).values({
		teamId: team.id,
		userId: publicUser.id,
		role: 'owner',
	})

	console.log('Team created.')
}

seed()
	.catch((error) => {
		console.error('Seed process failed:', error)
		process.exit(1)
	})
	.finally(() => {
		console.log('Seed process finished. Exiting...')
		process.exit(0)
	})
