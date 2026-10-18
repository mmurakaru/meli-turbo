import { Effect, Option, Redacted } from 'effect'
import { describe, expect, it } from 'vitest'
import { boundedRelease, redisOptionsFromConfig } from './Redis.ts'

describe('boundedRelease', () => {
  it('returns once a release that never settles hits the timeout', async () => {
    const start = Date.now()
    await Effect.runPromise(boundedRelease(Effect.never, '50 millis'))
    expect(Date.now() - start).toBeLessThan(1000)
  })

  it('swallows release failures', async () => {
    await expect(
      Effect.runPromise(boundedRelease(Effect.fail(new Error('boom')), '1 second')),
    ).resolves.toBeUndefined()
  })
})

describe('redisOptionsFromConfig', () => {
  it('keeps maxRetriesPerRequest null for BullMQ connections', () => {
    const options = redisOptionsFromConfig({
      host: 'localhost',
      port: 6379,
      useTls: false,
      keyPrefix: 'cortex',
      username: Option.none(),
      password: Option.some(Redacted.make('secret')),
    } as Parameters<typeof redisOptionsFromConfig>[0])
    expect(options.maxRetriesPerRequest).toBeNull()
    expect(options.password).toBe('secret')
  })
})
