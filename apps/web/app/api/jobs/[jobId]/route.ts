import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import { signJwtToken } from '@/lib/jwt'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await params

	try {
		const res = await fetch(`${env.CORTEX_URL}/sheets/jobs/${jobId}`, {
			headers: { Authorization: `Bearer ${signJwtToken()}` },
			signal: AbortSignal.timeout(10_000),
		})
		const data = await res.json()
		return NextResponse.json(data, { status: res.status })
	} catch {
		return NextResponse.json({ error: 'Failed to reach Cortex service' }, { status: 502 })
	}
}
