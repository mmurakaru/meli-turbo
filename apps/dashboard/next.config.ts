import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	sassOptions: {
		silenceDeprecations: ['legacy-js-api'],
	},
	experimental: {
		ppr: 'incremental',
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'storage.googleapis.com',
				pathname: '/eleven-public-cdn/images/**',
			},
		],
	},
}

export default nextConfig
