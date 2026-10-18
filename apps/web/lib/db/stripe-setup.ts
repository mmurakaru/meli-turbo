import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function stripeSetup() {
	const { getStripe } = await import('../payments/stripe')
	const stripe = getStripe()

	console.log('Creating Stripe products and prices...')

	const baseProduct = await stripe.products.create({
		name: 'Base',
		description: 'Base subscription plan',
	})

	await stripe.prices.create({
		product: baseProduct.id,
		unit_amount: 800,
		currency: 'usd',
		recurring: {
			interval: 'month',
			trial_period_days: 7,
		},
	})

	const plusProduct = await stripe.products.create({
		name: 'Plus',
		description: 'Plus subscription plan',
	})

	await stripe.prices.create({
		product: plusProduct.id,
		unit_amount: 1200,
		currency: 'usd',
		recurring: {
			interval: 'month',
			trial_period_days: 7,
		},
	})

	console.log('Stripe products and prices created successfully.')
}

stripeSetup()
	.catch((error) => {
		console.error('Stripe setup failed:', error)
		process.exit(1)
	})
	.finally(() => process.exit(0))
