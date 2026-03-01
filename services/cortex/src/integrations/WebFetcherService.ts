export type FetchedContent = {
  url: string
  contentType: 'html' | 'xml' | 'json' | 'text'
  body: string
}

export class WebFetcherService {
  private static readonly TIMEOUT_MS = 15_000
  private static readonly USER_AGENT = 'Meli/cortex (url-fetcher)'

  async fetch(url: string): Promise<FetchedContent> {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error(`Invalid URL: ${url}`)
    }

    const res = await globalThis.fetch(parsed.toString(), {
      headers: { 'User-Agent': WebFetcherService.USER_AGENT },
      signal: AbortSignal.timeout(WebFetcherService.TIMEOUT_MS),
    })

    if (!res.ok) {
      throw new Error(`Fetch failed for ${url}: HTTP ${res.status}`)
    }

    const rawContentType = res.headers.get('content-type') ?? ''
    const body = await res.text()
    const contentType = this.resolveContentType(rawContentType, body)

    return { url, contentType, body }
  }

  private resolveContentType(header: string, body: string): FetchedContent['contentType'] {
    if (header.includes('application/json') || header.includes('+json')) return 'json'
    if (
      header.includes('xml') ||
      header.includes('text/xml') ||
      body.trimStart().startsWith('<?xml')
    )
      return 'xml'
    if (
      header.includes('text/html') ||
      body.trimStart().startsWith('<!DOCTYPE') ||
      body.trimStart().startsWith('<html')
    )
      return 'html'
    return 'text'
  }
}
