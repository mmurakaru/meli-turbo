import path from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		watch: false,
		// Playwright specs live in tests/e2e and run via `pnpm test:e2e`, not Vitest.
		exclude: [...configDefaults.exclude, 'tests/e2e/**'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
		},
	},
})
