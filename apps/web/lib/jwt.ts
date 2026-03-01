import { createSigner } from 'fast-jwt'
import { env } from '@/env'

const getSigner = () =>
	createSigner({
		algorithm: 'RS256',
		key: env.CORTEX_JWT_PRIVATE_KEY,
		expiresIn: '1m',
	})

export function signJwtToken(): string {
	return getSigner()({ sub: 'meli-web' })
}
