import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
	const url = req.nextUrl.searchParams.get('url')
	if (!url) {
		return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
	}

	let targetUrl: string
	try {
		targetUrl = new URL(url).toString()
	} catch {
		return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
	}

	let text: string
	try {
		const res = await fetch(targetUrl, {
			headers: { 'User-Agent': 'Meli/1.0 (sitemap-importer)' },
			signal: AbortSignal.timeout(10_000),
		})
		if (!res.ok) {
			return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })
		}
		text = await res.text()
	} catch {
		return NextResponse.json({ error: 'Failed to fetch sitemap' }, { status: 502 })
	}

	const urls: string[] = []
	const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi
	let match: RegExpExecArray | null
	while ((match = locRegex.exec(text)) !== null) {
		if (match[1]) urls.push(match[1])
	}

	if (!urls.length) {
		return NextResponse.json({ error: 'No URLs found in sitemap' }, { status: 422 })
	}

	return NextResponse.json({ urls })
}
