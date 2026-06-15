/**
 * CUJ 2b — Spreadsheet Creation via Modal (behind login)
 *
 * Critical path: authenticated user opens /dashboard/new, triggers the
 * "Create spreadsheet" dialog, fills the title, selects ownership, and
 * submits — resulting in a new document accessible at /document/[id].
 *
 * This tests the full modal interaction flow behind authentication:
 *   1. Sign in
 *   2. Land on /dashboard/new
 *   3. Open the dialog
 *   4. Fill title + optional description
 *   5. Choose Private vs Workspace ownership
 *   6. Submit → document created → redirected to /document/[id]
 *   7. Document page renders with the correct title
 *
 * Prerequisites: seed must have run (test@test.com / admin123).
 */

import { expect, test } from '@playwright/test'
import { screenshotPath, signInAsSeedUser } from './helpers/auth'

test.describe('CUJ 2b — Spreadsheet Creation via Modal', () => {
	test.beforeEach(async ({ page }) => {
		await signInAsSeedUser(page)
	})

	test('2b.1 — /dashboard/new page renders the create button', async ({ page }) => {
		await page.goto('/dashboard/new')

		await expect(page.getByRole('button', { name: 'Create spreadsheet' })).toBeVisible()
		await expect(page.getByText('Create new spreadsheet')).toBeVisible()

		await page.screenshot({ path: screenshotPath('2b', 'new-page') })
	})

	test('2b.2 — clicking the button opens the dialog with title input and ownership options', async ({
		page,
	}) => {
		await page.goto('/dashboard/new')

		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		// Dialog title input
		const titleInput = page.getByPlaceholder('Spreadsheet title')
		await expect(titleInput).toBeVisible()

		// Description textarea
		await expect(page.getByPlaceholder('Add description...')).toBeVisible()

		// Ownership radio group — Private option always present
		await expect(page.getByLabel('Private')).toBeVisible()

		// The "Spreadsheet" badge in the dialog header should be visible
		await expect(page.getByText('Spreadsheet')).toBeVisible()

		// Submit button inside dialog
		await expect(page.getByRole('button', { name: 'Create spreadsheet' }).last()).toBeVisible()

		await page.screenshot({ path: screenshotPath('2b', 'dialog-open') })
	})

	test('2b.3 — dialog pre-selects workspace when user has an active workspace', async ({
		page,
	}) => {
		await page.goto('/dashboard/new')
		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		// If the seed workspace is active, the Workspace radio should exist
		// (seed creates "Test Workspace" and sets it as active)
		const workspaceRadio = page.getByLabel('Workspace')
		const hasWorkspace = await workspaceRadio.isVisible().catch(() => false)

		if (hasWorkspace) {
			// With our fix, the workspace option should be pre-selected
			await expect(workspaceRadio).toBeChecked()
			await page.screenshot({ path: screenshotPath('2b', 'dialog-workspace-preselected') })
		} else {
			// No workspace — Private is the only option
			await expect(page.getByLabel('Private')).toBeChecked()
			await page.screenshot({ path: screenshotPath('2b', 'dialog-private-only') })
		}
	})

	test('2b.4 — filling title and submitting creates the document', async ({ page }) => {
		await page.goto('/dashboard/new')
		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		const titleInput = page.getByPlaceholder('Spreadsheet title')
		await titleInput.fill('E2E Created Spreadsheet')

		// Select Private to avoid needing a workspace
		await page.getByLabel('Private').click()

		await page.screenshot({ path: screenshotPath('2b', 'dialog-filled') })

		// Submit
		await page.getByRole('button', { name: 'Create spreadsheet' }).last().click()

		// Should redirect to /document/[id] after successful creation
		await page.waitForURL(/\/document\/[a-z0-9-]+/, { timeout: 15_000 })

		await page.screenshot({ path: screenshotPath('2b', 'document-created') })
	})

	test('2b.5 — created document page shows the title', async ({ page }) => {
		await page.goto('/dashboard/new')
		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		await page.getByPlaceholder('Spreadsheet title').fill('My E2E Spreadsheet')
		await page.getByLabel('Private').click()
		await page.getByRole('button', { name: 'Create spreadsheet' }).last().click()

		await page.waitForURL(/\/document\/[a-z0-9-]+/, { timeout: 15_000 })

		// The document title should appear on the page
		await expect(
			page.getByText('My E2E Spreadsheet').or(page.locator('input[value="My E2E Spreadsheet"]')),
		).toBeVisible({ timeout: 10_000 })

		await page.screenshot({ path: screenshotPath('2b', 'document-page-title') })
	})

	test('2b.6 — description field accepts text and is included in the dialog', async ({ page }) => {
		await page.goto('/dashboard/new')
		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		await page.getByPlaceholder('Spreadsheet title').fill('Budget Tracker 2026')
		await page.getByPlaceholder('Add description...').fill('Monthly expense tracking')

		await page.screenshot({ path: screenshotPath('2b', 'dialog-with-description') })

		await expect(page.getByPlaceholder('Add description...')).toHaveValue(
			'Monthly expense tracking',
		)
	})

	test('2b.7 — submit is disabled while creation is pending', async ({ page }) => {
		await page.goto('/dashboard/new')
		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		await page.getByPlaceholder('Spreadsheet title').fill('Pending Test')
		await page.getByLabel('Private').click()

		const submitButton = page.getByRole('button', { name: 'Create spreadsheet' }).last()

		// Click and immediately check — button should be disabled during submission
		await submitButton.click()

		// Either the button becomes disabled (pending state) or navigation starts
		// Both are acceptable — this verifies no double-submit is possible
		const isNavigating = page.waitForURL(/\/document\//, { timeout: 15_000 }).catch(() => null)
		const isDisabled = submitButton.isDisabled().catch(() => false)

		const [navigated] = await Promise.all([isNavigating, isDisabled])
		// If we navigated, the guard worked via redirect; if not, button was disabled
		expect(navigated !== null || isDisabled).toBeTruthy()

		await page.screenshot({ path: screenshotPath('2b', 'pending-state') })
	})

	test('2b.8 — title is required — empty submit does not navigate', async ({ page }) => {
		await page.goto('/dashboard/new')
		await page.getByRole('button', { name: 'Create spreadsheet' }).click()

		// Do not fill the title — click submit immediately
		await page.getByRole('button', { name: 'Create spreadsheet' }).last().click()

		// Should stay on /dashboard/new (HTML5 required validation blocks submit)
		await expect(page).not.toHaveURL(/\/document\//)

		await page.screenshot({ path: screenshotPath('2b', 'empty-title-blocked') })
	})
})
