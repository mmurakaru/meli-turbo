import { describe, expect, it } from '@effect/vitest'
import { ConfigProvider, Effect, Layer, Option } from 'effect'
import { AppConfig, AppConfigLive } from './config.ts'

const testProvider = ConfigProvider.fromMap(
  new Map([
    ['JWT_PUBLIC_KEY', 'line-one||line-two'],
    ['DATABASE_URL', 'postgres://user:pass@localhost:5432/db'],
  ]),
)

const TestConfigLayer = AppConfigLive.pipe(Layer.provide(Layer.setConfigProvider(testProvider)))

describe('AppConfig', () => {
  it.effect('applies defaults for unset variables', () =>
    Effect.gen(function* () {
      const config = yield* AppConfig
      expect(config.app.port).toBe(3000)
      expect(config.app.nodeEnv).toBe('development')
      expect(config.redis.keyPrefix).toBe('cortex')
      expect(config.ai.model).toBe('qwen2.5:7b')
      expect(config.observability.prometheusPort).toBe(9080)
    }).pipe(Effect.provide(TestConfigLayer)),
  )

  it.effect('decodes the || newline separator in the JWT public key', () =>
    Effect.gen(function* () {
      const config = yield* AppConfig
      expect(config.app.jwtPublicKey).toBe('line-one\nline-two')
    }).pipe(Effect.provide(TestConfigLayer)),
  )

  it.effect('leaves optional secrets absent when unset', () =>
    Effect.gen(function* () {
      const config = yield* AppConfig
      expect(Option.isNone(config.posthog.apiKey)).toBe(true)
      expect(Option.isNone(config.redis.password)).toBe(true)
    }).pipe(Effect.provide(TestConfigLayer)),
  )
})
