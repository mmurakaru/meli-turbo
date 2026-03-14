import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getUser } from '@/lib/auth/dal'
import { db } from '@/lib/db/drizzle'
import { publicUsers, workspaceMembers, workspaces } from '@/lib/db/schema'
import { stripe } from '@/lib/payments/stripe'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const sessionId = searchParams.get('session_id')

	if (!sessionId) {
		return NextResponse.redirect(new URL('/pricing', request.url))
	}

	try {
		const authUser = await getUser()

		if (!authUser) {
			throw new Error('User not authenticated.')
		}

		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['customer', 'subscription'],
		})

		if (!session.customer || typeof session.customer === 'string') {
			throw new Error('Invalid customer data from Stripe.')
		}

		const customerId = session.customer.id
		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

		if (!subscriptionId) {
			throw new Error('No subscription found for this session.')
		}

		const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
			expand: ['items.data.price.product'],
		})

		const plan = subscription.items.data[0]?.price

		if (!plan) {
			throw new Error('No plan found for this subscription.')
		}

		const productId = (plan.product as Stripe.Product).id

		if (!productId) {
			throw new Error('No product ID found for this subscription.')
		}

		const userId = session.client_reference_id
		if (!userId) {
			throw new Error("No user ID found in session's client_reference_id.")
		}

		const user = await db.select().from(publicUsers).where(eq(publicUsers.id, userId)).limit(1)

		if (user.length === 0) {
			throw new Error('User not found in database.')
		}

		const userWorkspace = await db
			.select({
				workspaceId: workspaceMembers.workspaceId,
			})
			.from(workspaceMembers)
			.where(eq(workspaceMembers.userId, user[0].id))
			.limit(1)

		if (userWorkspace.length === 0) {
			throw new Error('User is not associated with any workspace.')
		}

		await db
			.update(workspaces)
			.set({
				stripeCustomerId: customerId,
				stripeSubscriptionId: subscriptionId,
				stripeProductId: productId,
				planName: (plan.product as Stripe.Product).name,
				subscriptionStatus: subscription.status,
				updatedAt: new Date(),
			})
			.where(eq(workspaces.id, userWorkspace[0].workspaceId))

		return NextResponse.redirect(new URL('/dashboard', request.url))
	} catch (_error) {
		return NextResponse.redirect(new URL('/error', request.url))
	}
}
