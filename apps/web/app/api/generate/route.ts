import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import { signJwtToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
	let body: unknown
	try {
		body = await req.json()
	} catch {
		return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
	}

	try {
		const res = await fetch(`${env.CORTEX_URL}/sheets/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${signJwtToken()}`,
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(10_000),
		})
		const data = await res.json()
		return NextResponse.json(data, { status: res.status })
	} catch {
		return NextResponse.json({ error: 'Failed to reach Cortex service' }, { status: 502 })
	}
}
