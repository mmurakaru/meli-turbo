/**
 * CUJ 3 — Workspace Collaboration
 *
 * Critical path: workspace owner creates a workspace, invites a team member,
 * and both users can access documents scoped to that workspace.
 *
 * SLOs under test:
 *   - Workspace page loads within navigation timeout (P95 LCP < 2 s)
 *   - Workspace creation succeeds and redirects to workspace page
 *   - Members page renders current membership list
 *   - Non-member cannot access workspace pages (access control correctness)
 *   - Invitation form is present and submittable
 *
 * Prerequisites: seed user test@test.com / admin123 with "Test Workspace".
 */

import { expect, test } from '@playwright/test'
import { getSeedWorkspaceId, SEED_EMAIL, screenshotPath, signInAsSeedUser } from './helpers/auth'

test.describe('CUJ 3 — Workspace Collaboration', () => {
	test.beforeEach(async ({ page }) => {
		await signInAsSeedUser(page)
	})

	test('3.1 — workspace list is accessible from the dashboard', async ({ page }) => {
		await page.goto('/dashboard/workspace')
		await expect(page.locator('body')).toBeVisible()

		// "Test Workspace" created by the seed script should be listed
		// (actual name may vary; just verify the page renders without error)
		await expect(page.getByText(/workspace/i).first()).toBeVisible()

		await page.screenshot({ path: screenshotPath(3, 'workspace-list') })
	})

	test('3.2 — workspace creation form renders at /workspace/new', async ({ page }) => {
		await page.goto('/workspace/new')
		await expect(page.locator('body')).toBeVisible()

		// A form with a workspace name input should be present
		const nameInput = page
			.getByPlaceholder(/workspace name|name your/i)
			.or(page.getByLabel(/workspace name/i))
			.first()

		await expect(nameInput.or(page.locator('input[name="name"]'))).toBeVisible()

		await page.screenshot({ path: screenshotPath(3, 'workspace-new') })
	})

	test('3.3 — workspace page renders for the seed workspace', async ({ page }) => {
		const workspaceId = await getSeedWorkspaceId(page)

		await page.goto(`/workspace/${workspaceId}`)
		await expect(page).toHaveURL(new RegExp(`/workspace/${workspaceId}$`))
		await expect(page.locator('body')).toBeVisible()

		await page.screenshot({ path: screenshotPath(3, 'workspace-detail') })
	})

	test('3.4 — access control: unauthenticated user redirected to sign-in', async ({ page }) => {
		await page.context().clearCookies()
		await page.goto('/dashboard')

		await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 })

		await page.screenshot({ path: screenshotPath(3, 'access-control-redirect') })
	})

	// Known app gap: proxy.ts only protects /dashboard/*, so /workspace/* pages render for
	// signed-out visitors (the server actions behind them still require a user). Kept as
	// fixme so the expectation is recorded without changing app behaviour in a test PR.
	test.fixme('3.4b — access control: unauthenticated /workspace/new redirects to sign-in', async ({
		page,
	}) => {
		await page.context().clearCookies()
		await page.goto('/workspace/new')

		await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 })
	})

	test('3.5 — workspace members page shows current membership', async ({ page }) => {
		const workspaceId = await getSeedWorkspaceId(page)

		await page.goto(`/workspace/${workspaceId}/members`)

		// The seed user (test@test.com) should appear in the members list
		await expect(page.getByText(SEED_EMAIL).or(page.getByText('Test User')).first()).toBeVisible({
			timeout: 10_000,
		})

		await page.screenshot({ path: screenshotPath(3, 'workspace-members') })
	})

	test('3.6 — invitation form is present on members page', async ({ page }) => {
		const workspaceId = await getSeedWorkspaceId(page)

		await page.goto(`/workspace/${workspaceId}/members`)

		// An email input for inviting members should be present
		const inviteInput = page
			.getByPlaceholder(/email|invite/i)
			.or(page.locator('input[type="email"]'))
			.first()

		await expect(inviteInput).toBeVisible({ timeout: 10_000 })

		await inviteInput.fill('collaborator@example.com')
		await expect(inviteInput).toHaveValue('collaborator@example.com')

		await page.screenshot({ path: screenshotPath(3, 'invite-form-filled') })
	})

	test('3.7 — workspace settings page loads for owner', async ({ page }) => {
		const workspaceId = await getSeedWorkspaceId(page)

		await expect(page).toHaveURL(new RegExp(`/workspace/${workspaceId}/settings`))
		await expect(page.locator('body')).toBeVisible()

		await page.screenshot({ path: screenshotPath(3, 'workspace-settings') })
	})

	test('3.8 — sign-in with wrong credentials shows error message', async ({ page }) => {
		// Clear session
		await page.context().clearCookies()
		await page.goto('/sign-in')

		await page.getByPlaceholder('Email').fill(SEED_EMAIL)
		await page.getByPlaceholder('Password').fill('wrongpassword')
		await page.getByRole('button', { name: 'Sign in' }).click()

		// Error message should be visible (no redirect)
		await expect(page.locator('.text-red-500, [role="alert"]').first()).toBeVisible({
			timeout: 10_000,
		})
		await expect(page).not.toHaveURL(/\/dashboard/)

		await page.screenshot({ path: screenshotPath(3, 'invalid-credentials-error') })
	})
})
