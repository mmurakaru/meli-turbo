import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// cacheComponents: true,
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
