import path from 'node:path'
import { defineConfig } from 'vitest/config'

// biome-ignore lint/style/noDefaultExport: vitest expects default export
export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		watch: false,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
		},
	},
})
