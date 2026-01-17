import type { Config } from 'drizzle-kit'

export default {
	schema: './lib/db/schema.ts',
	out: './lib/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: tbd
		url: process.env.POSTGRES_URL!,
	},
	schemaFilter: 'public',
} satisfies Config
