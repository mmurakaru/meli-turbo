import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockEnv: { STRIPE_SECRET_KEY?: string; BASE_URL: string } = {
	BASE_URL: 'http://localhost:3000',
}
const pricesList = vi.fn()
const productsList = vi.fn()
const stripeConstructor = vi.fn()

vi.mock('@/env', () => ({ env: mockEnv }))
vi.mock('@/lib/db/queries', () => ({
	getUser: vi.fn(),
	getWorkspaceByStripeCustomerId: vi.fn(),
	updateWorkspaceSubscription: vi.fn(),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('stripe', () => ({
	default: class {
		prices = { list: pricesList }
		products = { list: productsList }
		constructor(key: string, config: unknown) {
			stripeConstructor(key, config)
			if (!key) throw new Error('Neither apiKey nor config.authenticator provided')
		}
	},
}))

async function loadModule() {
	vi.resetModules()
	return import('./stripe')
}

describe('lib/payments/stripe', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		delete mockEnv.STRIPE_SECRET_KEY
	})

	it('can be imported without a Stripe key', async () => {
		const mod = await loadModule()
		expect(mod.isStripeConfigured()).toBe(false)
		expect(stripeConstructor).not.toHaveBeenCalled()
	})

	it('getStripe throws a clear error when unconfigured', async () => {
		const { getStripe } = await loadModule()
		expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/)
	})

	it('getStripe creates a single client with the configured key', async () => {
		mockEnv.STRIPE_SECRET_KEY = 'sk_test_123'
		const { getStripe } = await loadModule()
		expect(getStripe()).toBe(getStripe())
		expect(stripeConstructor).toHaveBeenCalledTimes(1)
		expect(stripeConstructor).toHaveBeenCalledWith('sk_test_123', {
			apiVersion: '2026-10-28.endive',
		})
	})

	it('getPricingData returns empty lists without calling Stripe when unconfigured', async () => {
		const { getPricingData } = await loadModule()
		await expect(getPricingData()).resolves.toEqual({ prices: [], products: [] })
		expect(pricesList).not.toHaveBeenCalled()
	})

	it('getPricingData falls back to empty lists when Stripe rejects the request', async () => {
		mockEnv.STRIPE_SECRET_KEY = 'sk_test_invalid'
		pricesList.mockRejectedValue(new Error('Invalid API Key provided'))
		productsList.mockRejectedValue(new Error('Invalid API Key provided'))
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const { getPricingData } = await loadModule()
		await expect(getPricingData()).resolves.toEqual({ prices: [], products: [] })
		expect(warn).toHaveBeenCalled()
		warn.mockRestore()
	})

	it('getPricingData maps Stripe prices and products when configured', async () => {
		mockEnv.STRIPE_SECRET_KEY = 'sk_test_valid'
		pricesList.mockResolvedValue({
			data: [
				{
					id: 'price_1',
					product: { id: 'prod_1' },
					unit_amount: 800,
					currency: 'eur',
					recurring: { interval: 'month', trial_period_days: 14 },
				},
			],
		})
		productsList.mockResolvedValue({
			data: [{ id: 'prod_1', name: 'Base', description: null, default_price: 'price_1' }],
		})
		const { getPricingData } = await loadModule()
		await expect(getPricingData()).resolves.toEqual({
			prices: [
				{
					id: 'price_1',
					productId: 'prod_1',
					unitAmount: 800,
					currency: 'eur',
					interval: 'month',
					trialPeriodDays: 14,
				},
			],
			products: [{ id: 'prod_1', name: 'Base', description: null, defaultPriceId: 'price_1' }],
		})
	})
})
