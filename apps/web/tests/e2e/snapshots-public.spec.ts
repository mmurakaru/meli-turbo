/**
 * Public page snapshots — no auth or DB required.
 * Captures every public-facing route for the disposable screenshots PR.
 *
 * /pricing calls the live Stripe API on the server, so it only renders with a real
 * test-mode STRIPE_SECRET_KEY. Set E2E_STRIPE=1 to include it.
 */

import { test } from '@playwright/test'

const PUBLIC_ROUTES = [
	{ path: '/', name: 'home' },
	{ path: '/sign-in', name: 'sign-in' },
	{ path: '/sign-up', name: 'sign-up' },
	{ path: '/pricing', name: 'pricing', needsStripe: true },
	{ path: '/product', name: 'product' },
	{ path: '/use-cases', name: 'use-cases' },
	{ path: '/create', name: 'create-empty' },
]

test.describe('Public page snapshots', () => {
	for (const route of PUBLIC_ROUTES) {
		test(`snapshot — ${route.path}`, async ({ page }) => {
			test.skip(
				route.needsStripe === true && process.env.E2E_STRIPE !== '1',
				'Needs a real Stripe test key (set E2E_STRIPE=1)',
			)
			await page.goto(route.path)
			// Dismiss cookie banner if present
			const accept = page.getByRole('button', { name: /accept/i })
			if (await accept.isVisible().catch(() => false)) await accept.click()
			await page.screenshot({
				path: `tests/e2e/screenshots/public-${route.name}.png`,
				fullPage: true,
			})
		})
	}
})
