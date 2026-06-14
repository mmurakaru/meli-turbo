import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { env } from '@/env'
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
	const webhookSecret = env.STRIPE_WEBHOOK_SECRET
	if (!webhookSecret) {
		return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 500 })
	}

	const payload = await request.text()
	const signature = request.headers.get('stripe-signature') as string

	let event: Stripe.Event

	try {
		event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
	} catch (_err) {
		return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 })
	}

	switch (event.type) {
		case 'customer.subscription.updated':
		case 'customer.subscription.deleted': {
			const subscription = event.data.object as Stripe.Subscription
			await handleSubscriptionChange(subscription)
			break
		}
		default:
			break
	}

	return NextResponse.json({ received: true })
}
