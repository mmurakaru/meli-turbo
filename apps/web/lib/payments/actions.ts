'use server'

import { redirect } from 'next/navigation'
import { withWorkspace } from '@/lib/auth/middleware'
import { createCheckoutSession, createCustomerPortalSession } from './stripe'

export const checkoutAction = withWorkspace(async (formData, workspace) => {
	const priceId = formData.get('priceId') as string
	await createCheckoutSession({ workspace: workspace, priceId })
})

export const customerPortalAction = withWorkspace(async (_, workspace) => {
	const portalSession = await createCustomerPortalSession(workspace)
	redirect(portalSession.url)
})
