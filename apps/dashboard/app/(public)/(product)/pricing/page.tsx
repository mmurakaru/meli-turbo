import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { Check, Sparkle } from 'lucide-react'
import Link from 'next/link'
import { checkoutAction } from '@/lib/payments/actions'
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe'
import { SubmitButton } from './submit-button'

const FREE_PLAN_ID = 'Free'
const PLUS_PLAN_ID = 'Plus'

// Prices are fresh for one hour max (see cached Stripe helpers)

export default async function PricingPage() {
	const [prices, products] = await Promise.all([getStripePrices(), getStripeProducts()])

	const basePlan = products.find((product) => product.name === 'Base')
	const plusPlan = products.find((product) => product.name === 'Plus')

	const basePrice = prices.find((price) => price.productId === basePlan?.id)
	const plusPrice = prices.find((price) => price.productId === plusPlan?.id)

	return (
		<main className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
			<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
				<PricingCard
					name="Free"
					price={0}
					interval="month"
					trialDays={0}
					features={[
						'5 product tours',
						'Branded overlays',
						'Default Voice AI config',
						'2 Workspace members',
					]}
					priceId="free_price"
				/>
				<PricingCard
					name={basePlan?.name || 'Base'}
					price={basePrice?.unitAmount || 800}
					interval={basePrice?.interval || 'month'}
					trialDays={basePrice?.trialPeriodDays || 14}
					features={[
						'Everything in Free, and:',
						'Unlimited Product tours',
						'Unbranded Overlays',
						'Costum Voice AI config',
						'Asset upload',
						'25 Workspace Members',
					]}
					priceId={basePrice?.id}
				/>
				<PricingCard
					name={plusPlan?.name || 'Plus'}
					price={plusPrice?.unitAmount || 1200}
					interval={plusPrice?.interval || 'month'}
					trialDays={plusPrice?.trialPeriodDays || 14}
					features={[
						'Everything in Base, and:',
						'Unlimited Workspace Members',
						'Product tour Analytics',
						'Priority support',
					]}
					priceId={plusPrice?.id}
				/>
			</div>
		</main>
	)
}

function PricingCard({
	name,
	price,
	interval,
	trialDays,
	features,
	priceId,
}: {
	name: string
	price: number
	interval: string
	trialDays: number
	features: string[]
	priceId?: string
}) {
	const isFreePlan = name === FREE_PLAN_ID
	const isPlusPlan = name === PLUS_PLAN_ID

	return (
		<div className="pt-6">
			<div className="flex gap-1">
				<h2
					className={cn(
						'text-2xl font-medium  mb-2',
						isPlusPlan ? 'text-violet-700' : 'text-gray-900',
					)}
				>
					{name}
				</h2>
				{isPlusPlan ? <Sparkle strokeWidth={1.5} className="text-violet-700 w-4 h-4" /> : null}
			</div>

			<p className="text-sm text-gray-600 mb-4">with {trialDays} day free trial</p>
			<p className="text-4xl font-medium text-gray-900 mb-6">
				€{price / 100}{' '}
				<span className="text-xl font-normal text-gray-600">per user / {interval}</span>
			</p>
			<form action={checkoutAction} className="mb-8">
				<input type="hidden" name="priceId" value={priceId} />
				{isFreePlan ? (
					<Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
						Get started
					</Link>
				) : (
					<SubmitButton plan={name} />
				)}
			</form>
			<ul className="space-y-4">
				{features.map((feature) => (
					<li key={feature} className="flex items-start">
						<Check className="h-5 w-5 text-violet-700 mr-2 mt-0.5 shrink-0" />
						<span className="text-gray-700">{feature}</span>
					</li>
				))}
			</ul>
		</div>
	)
}
