import { describe, expect, it } from '@effect/vitest'
import { ConfigProvider, Effect, Layer, Option } from 'effect'
import { AppConfig, AppConfigLive } from './config.ts'

const testProvider = ConfigProvider.fromEnv({
  env: {
    JWT_PUBLIC_KEY: 'line-one||line-two',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  },
})

const TestConfigLayer = AppConfigLive.pipe(Layer.provide(ConfigProvider.layer(testProvider)))

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

const layerFor = (env: Record<string, string>) =>
  AppConfigLive.pipe(
    Layer.provide(
      ConfigProvider.layer(
        ConfigProvider.fromEnv({
          env: {
            JWT_PUBLIC_KEY: 'key',
            DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
            ...env,
          },
        }),
      ),
    ),
  )

describe('AppConfig parsing', () => {
  it.effect('accepts LOG_LEVEL case-insensitively', () =>
    Effect.gen(function* () {
      const lower = yield* Effect.provide(
        Effect.service(AppConfig),
        layerFor({ LOG_LEVEL: 'debug' }),
      )
      const upper = yield* Effect.provide(
        Effect.service(AppConfig),
        layerFor({ LOG_LEVEL: 'WARN' }),
      )
      expect(lower.app.logLevel).toBe('Debug')
      expect(upper.app.logLevel).toBe('Warn')
    }),
  )

  it.effect('rejects an unknown LOG_LEVEL', () =>
    Effect.gen(function* () {
      const result = yield* Effect.exit(
        Effect.provide(Effect.service(AppConfig), layerFor({ LOG_LEVEL: 'bogus' })),
      )
      expect(result._tag).toBe('Failure')
    }),
  )

  it.effect('parses boolean flags with the Effect 3 vocabulary', () =>
    Effect.gen(function* () {
      for (const [raw, expected] of [
        ['true', true],
        ['yes', true],
        ['on', true],
        ['1', true],
        ['false', false],
        ['no', false],
        ['off', false],
        ['0', false],
      ] as const) {
        const config = yield* Effect.provide(
          Effect.service(AppConfig),
          layerFor({ OTEL_TRACING_ENABLED: raw, REDIS_USE_TLS: raw }),
        )
        expect(config.observability.tracingEnabled).toBe(expected)
        expect(config.redis.useTls).toBe(expected)
      }
    }),
  )
})
