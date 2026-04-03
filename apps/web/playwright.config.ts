import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Critical User Journey (CUJ) end-to-end tests.
 *
 * Browsers: uses the system Playwright Chromium at /opt/pw-browsers when
 * available, falling back to the default downloaded build.
 */
const systemChromiumPath = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
		screenshot: 'on',
		video: 'off',
		trace: 'on-first-retry',
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Use the pre-installed Playwright Chromium build (build 1194) rather
				// than the version-matched headless-shell so tests work offline.
				channel: undefined,
				browserName: 'chromium',
				launchOptions: {
					executablePath: systemChromiumPath,
					args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
				},
				viewport: { width: 1280, height: 800 },
			},
		},
	],

	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: 'ignore',
		stderr: 'pipe',
	},
})
