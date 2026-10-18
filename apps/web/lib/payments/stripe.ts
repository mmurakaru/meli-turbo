import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { env } from '@/env'
import {
	getUser,
	getWorkspaceByStripeCustomerId,
	updateWorkspaceSubscription,
} from '@/lib/db/queries'
import type { Workspace } from '@/lib/db/schema'

const STRIPE_API_VERSION = '2026-02-25.clover'

let stripeClient: Stripe | undefined

/** True when STRIPE_SECRET_KEY is set. Billing UI degrades gracefully when it isn't. */
export function isStripeConfigured(): boolean {
	return Boolean(env.STRIPE_SECRET_KEY)
}

/**
 * Lazily creates the Stripe client on first use, so importing this module (e.g. while
 * `next build` collects pages) never needs a Stripe key. Throws a clear error when a
 * Stripe API call is attempted without STRIPE_SECRET_KEY.
 */
export function getStripe(): Stripe {
	const secretKey = env.STRIPE_SECRET_KEY
	if (!secretKey) {
		throw new Error('Stripe is not configured: set STRIPE_SECRET_KEY to enable billing.')
	}
	stripeClient ??= new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
	return stripeClient
}

export async function createCheckoutSession({
	workspace,
	priceId,
}: {
	workspace: Workspace | null
	priceId: string
}) {
	const user = await getUser()

	if (!workspace || !user) {
		redirect(`/sign-up?redirect=checkout&priceId=${priceId}`)
	}

	const session = await getStripe().checkout.sessions.create({
		payment_method_types: ['card'],
		line_items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		mode: 'subscription',
		success_url: `${env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${env.BASE_URL}/pricing`,
		customer: workspace.stripeCustomerId || undefined,
		client_reference_id: user.id.toString(),
		allow_promotion_codes: true,
		subscription_data: {
			trial_period_days: 14,
		},
	})

	// biome-ignore lint/style/noNonNullAssertion: todo
	redirect(session.url!)
}

export async function createCustomerPortalSession(workspace: Workspace) {
	if (!workspace.stripeCustomerId || !workspace.stripeProductId) {
		redirect('/pricing')
	}

	let configuration: Stripe.BillingPortal.Configuration
	const configurations = await getStripe().billingPortal.configurations.list()

	if (configurations.data.length > 0) {
		configuration = configurations.data[0]
	} else {
		const product = await getStripe().products.retrieve(workspace.stripeProductId)
		if (!product.active) {
			throw new Error("Workspace's product is not active in Stripe")
		}

		const prices = await getStripe().prices.list({
			product: product.id,
			active: true,
		})
		if (prices.data.length === 0) {
			throw new Error("No active prices found for the workspace's product")
		}

		configuration = await getStripe().billingPortal.configurations.create({
			business_profile: {
				headline: 'Manage your subscription',
			},
			features: {
				subscription_update: {
					enabled: true,
					default_allowed_updates: ['price', 'quantity', 'promotion_code'],
					proration_behavior: 'create_prorations',
					products: [
						{
							product: product.id,
							prices: prices.data.map((price) => price.id),
						},
					],
				},
				subscription_cancel: {
					enabled: true,
					mode: 'at_period_end',
					cancellation_reason: {
						enabled: true,
						options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'],
					},
				},
			},
		})
	}

	return getStripe().billingPortal.sessions.create({
		customer: workspace.stripeCustomerId,
		return_url: `${env.BASE_URL}/dashboard`,
		configuration: configuration.id,
	})
}

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string
	const subscriptionId = subscription.id
	const status = subscription.status

	const workspace = await getWorkspaceByStripeCustomerId(customerId)

	if (!workspace) {
		// console.error('Workspace not found for Stripe customer:', customerId)
		return
	}

	if (status === 'active' || status === 'trialing') {
		const plan = subscription.items.data[0]?.plan
		await updateWorkspaceSubscription(workspace.id, {
			stripeSubscriptionId: subscriptionId,
			stripeProductId: plan?.product as string,
			planName: (plan?.product as Stripe.Product | undefined)?.name ?? null,
			subscriptionStatus: status,
		})
	} else if (status === 'canceled' || status === 'unpaid') {
		await updateWorkspaceSubscription(workspace.id, {
			stripeSubscriptionId: null,
			stripeProductId: null,
			planName: null,
			subscriptionStatus: status,
		})
	}
}

export async function getStripePrices() {
	const prices = await getStripe().prices.list({
		expand: ['data.product'],
		active: true,
		type: 'recurring',
	})

	return prices.data.map((price) => ({
		id: price.id,
		productId: typeof price.product === 'string' ? price.product : price.product.id,
		unitAmount: price.unit_amount,
		currency: price.currency,
		interval: price.recurring?.interval,
		trialPeriodDays: price.recurring?.trial_period_days,
	}))
}

export async function getStripeProducts() {
	const products = await getStripe().products.list({
		active: true,
		expand: ['data.default_price'],
	})

	return products.data.map((product) => ({
		id: product.id,
		name: product.name,
		description: product.description,
		defaultPriceId:
			typeof product.default_price === 'string' ? product.default_price : product.default_price?.id,
	}))
}

export type StripePrice = Awaited<ReturnType<typeof getStripePrices>>[number]
export type StripeProduct = Awaited<ReturnType<typeof getStripeProducts>>[number]

/**
 * Prices and products for the pricing page. Never throws: when Stripe is unconfigured
 * or unreachable (e.g. an invalid key during `next build`), it returns empty lists so
 * the page falls back to its built-in plan defaults instead of crashing.
 */
export async function getPricingData(): Promise<{
	prices: StripePrice[]
	products: StripeProduct[]
}> {
	if (!isStripeConfigured()) {
		return { prices: [], products: [] }
	}
	try {
		const [prices, products] = await Promise.all([getStripePrices(), getStripeProducts()])
		return { prices, products }
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: surface Stripe misconfiguration in server logs
		console.warn(
			'[pricing] Could not load Stripe prices, using default plans:',
			error instanceof Error ? error.message : error,
		)
		return { prices: [], products: [] }
	}
}
