import { Context, Effect, Layer, Option, Redacted } from 'effect'
import { Redis, type RedisOptions } from 'ioredis'
import { AppConfig, type AppConfigValues } from './config.ts'

export class RedisConnection extends Context.Tag('RedisConnection')<RedisConnection, Redis>() {}

/**
 * ioredis client for the result cache and healthchecks, closed with the runtime
 * scope. It carries the configured keyPrefix; BullMQ gets the unprefixed base
 * options plus its own prefix, so cache keys and queue keys never collide.
 */
export const RedisLive = Layer.scoped(
  RedisConnection,
  Effect.gen(function* () {
    const config = yield* AppConfig
    return yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new Redis({ ...redisOptionsFromConfig(config.redis), keyPrefix: config.redis.keyPrefix }),
      ),
      (client) => Effect.promise(() => client.quit().then(noop, noop)),
    )
  }),
)

/**
 * The subset of ioredis options we set. Kept narrow so it is assignable both to
 * ioredis' RedisOptions and to BullMQ v6's backend-agnostic ConnectionOptions.
 */
export type BaseRedisOptions = Pick<
  RedisOptions,
  'host' | 'port' | 'maxRetriesPerRequest' | 'tls' | 'username' | 'password'
>

/** Base connection options, without any ioredis keyPrefix. */
export function redisOptionsFromConfig(redis: AppConfigValues['redis']): BaseRedisOptions {
  return {
    host: redis.host,
    port: redis.port,
    maxRetriesPerRequest: null,
    ...(redis.useTls ? { tls: {} } : {}),
    ...Option.match(redis.username, {
      onNone: () => ({}),
      onSome: (username) => ({ username }),
    }),
    ...Option.match(redis.password, {
      onNone: () => ({}),
      onSome: (password) => ({ password: Redacted.value(password) }),
    }),
  }
}

function noop(): void {}
