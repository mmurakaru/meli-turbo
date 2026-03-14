import { Google } from 'arctic'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/env'

export async function GET(request: Request) {
	const { origin } = new URL(request.url)
	const cookieStore = await cookies()

	const exportPending = cookieStore.get('export_pending')?.value
	if (!exportPending) {
		return NextResponse.redirect(`${origin}/create?error=no_export`)
	}

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		return NextResponse.redirect(`${origin}/create?error=google_not_configured`)
	}

	const google = new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		`${origin}/api/export/google-sheets/callback`,
	)

	const state = crypto.randomUUID()
	const codeVerifier = crypto.randomUUID()

	const url = google.createAuthorizationURL(state, codeVerifier, [
		'https://www.googleapis.com/auth/spreadsheets',
	])

	cookieStore.set('export_oauth_state', state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 600,
		path: '/',
	})
	cookieStore.set('export_code_verifier', codeVerifier, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 600,
		path: '/',
	})

	return NextResponse.redirect(url.toString())
}
