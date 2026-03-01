import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
	server: {
		POSTGRES_URL: z.url(),
		STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
		STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
		BASE_URL: z.url(),
		SESSION_SECRET: z.string().min(32),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
		NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
		CORTEX_URL: z.url().default('http://localhost:3001'),
		CORTEX_JWT_PRIVATE_KEY: z.string().min(1),
	},
	client: {},
	runtimeEnv: {
		POSTGRES_URL: process.env.POSTGRES_URL,
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		BASE_URL: process.env.BASE_URL,
		SESSION_SECRET: process.env.SESSION_SECRET,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		CORTEX_URL: process.env.CORTEX_URL,
		CORTEX_JWT_PRIVATE_KEY: process.env.CORTEX_JWT_PRIVATE_KEY,
	},
})
