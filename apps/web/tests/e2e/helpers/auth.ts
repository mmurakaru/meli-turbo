import type { Page } from '@playwright/test'

export const SEED_EMAIL = 'test@test.com'
export const SEED_PASSWORD = 'admin123'

/**
 * Signs in with the seeded test credentials and waits for the dashboard to load.
 * Reuse this helper across all CUJ tests to avoid repeating login steps.
 */
export async function signInAsSeedUser(page: Page): Promise<void> {
	await page.goto('/sign-in')
	await page.getByPlaceholder('Email').fill(SEED_EMAIL)
	await page.getByPlaceholder('Password').fill(SEED_PASSWORD)
	await page.getByRole('button', { name: 'Sign in' }).click()
	await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

/**
 * Returns the screenshot path for a given test step.
 */
export function screenshotPath(cujNumber: number | string, stepName: string): string {
	return `tests/e2e/screenshots/cuj-${cujNumber}-${stepName}.png`
}
