import { Context, type Duration, Effect, Layer, Option, Redacted } from 'effect'
import { Redis, type RedisOptions } from 'ioredis'
import { AppConfig, type AppConfigValues } from './config.ts'

export class RedisConnection extends Context.Service<RedisConnection, Redis>()('RedisConnection') {}

/**
 * ioredis client for the result cache and healthchecks, closed with the runtime
 * scope. It carries the configured keyPrefix; BullMQ gets the unprefixed base
 * options plus its own prefix, so cache keys and queue keys never collide.
 */
export const RedisLive = Layer.effect(
  RedisConnection,
  Effect.gen(function* () {
    const config = yield* AppConfig
    return yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new Redis({
            ...redisOptionsFromConfig(config.redis),
            // The cache and healthcheck must fail fast while Redis is down, instead of
            // queueing commands forever (BullMQ needs `null`; this client is not BullMQ's).
            maxRetriesPerRequest: 1,
            keyPrefix: config.redis.keyPrefix,
          }),
      ),
      (client) =>
        boundedRelease(Effect.promise(() => client.quit().then(noop, noop))).pipe(
          Effect.andThen(Effect.sync(() => client.disconnect())),
        ),
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

/** Upper bound for closing a Redis-backed resource during shutdown. */
export const REDIS_RELEASE_TIMEOUT = '5 seconds'

/**
 * Bounds a release step. ioredis `quit()` and BullMQ `close()` wait for the connection
 * forever while Redis is unreachable, which would block every later finalizer and hang
 * shutdown; past the timeout the step is interrupted and shutdown carries on.
 */
export const boundedRelease = <A, E, R>(
  release: Effect.Effect<A, E, R>,
  timeout: Duration.Input = REDIS_RELEASE_TIMEOUT,
) => release.pipe(Effect.timeout(timeout), Effect.ignore)

function noop(): void {}
