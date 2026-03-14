import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			title?: string
			columns?: { id: string; label: string }[]
			rows?: Record<string, string>[]
		}

		const cookieStore = await cookies()
		cookieStore.set('export_pending', JSON.stringify(body), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 600,
			path: '/',
		})

		return NextResponse.json({ ok: true })
	} catch {
		return NextResponse.json({ error: 'Failed to initiate export' }, { status: 500 })
	}
}
