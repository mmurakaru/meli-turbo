import { Data, Effect } from 'effect'

export type FetchedContent = {
  readonly url: string
  readonly contentType: 'html' | 'xml' | 'json' | 'text'
  readonly body: string
}

export class SourceFetchError extends Data.TaggedError('SourceFetchError')<{
  readonly url: string
  readonly reason: string
}> {}

const TIMEOUT_MS = 15_000
const USER_AGENT = 'Meli/cortex (url-fetcher)'

/** Fetches a URL (HTML/XML/JSON/text) as context for generation, as an Effect. */
export function fetchSource(url: string): Effect.Effect<FetchedContent, SourceFetchError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => new URL(url),
      catch: () => new SourceFetchError({ url, reason: `Invalid URL: ${url}` }),
    })

    const response = yield* Effect.tryPromise({
      try: (signal) =>
        globalThis.fetch(parsed.toString(), {
          headers: { 'User-Agent': USER_AGENT },
          signal,
        }),
      catch: (cause) => new SourceFetchError({ url, reason: `Fetch failed: ${String(cause)}` }),
    }).pipe(Effect.timeout(TIMEOUT_MS))

    if (!response.ok) {
      return yield* new SourceFetchError({ url, reason: `HTTP ${response.status}` })
    }

    const rawContentType = response.headers.get('content-type') ?? ''
    const body = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (cause) => new SourceFetchError({ url, reason: `Body read failed: ${String(cause)}` }),
    })

    return { url, contentType: resolveContentType(rawContentType, body), body }
  }).pipe(
    Effect.catchTag('TimeoutError', () =>
      Effect.fail(new SourceFetchError({ url, reason: `Timed out after ${TIMEOUT_MS}ms` })),
    ),
  )
}

function resolveContentType(header: string, body: string): FetchedContent['contentType'] {
  if (header.includes('application/json') || header.includes('+json')) return 'json'
  if (header.includes('xml') || body.trimStart().startsWith('<?xml')) return 'xml'
  if (
    header.includes('text/html') ||
    body.trimStart().startsWith('<!DOCTYPE') ||
    body.trimStart().startsWith('<html')
  )
    return 'html'
  return 'text'
}
