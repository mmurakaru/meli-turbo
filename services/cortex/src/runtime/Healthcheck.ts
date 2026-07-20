import { SqlClient } from '@effect/sql'
import { Context, Effect, Layer } from 'effect'
import { RedisConnection } from './Redis.ts'

export type HealthReport = {
  readonly healthy: boolean
  readonly checks: { readonly postgres: 'ok' | 'fail'; readonly redis: 'ok' | 'fail' }
}

export class Healthcheck extends Context.Tag('Healthcheck')<
  Healthcheck,
  { readonly report: Effect.Effect<HealthReport> }
>() {}

export const HealthcheckLive = Layer.effect(
  Healthcheck,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const redis = yield* RedisConnection

    const postgresCheck = sql`SELECT 1`.pipe(
      Effect.timeout('2 seconds'),
      Effect.as('ok' as const),
      Effect.catchAll(() => Effect.succeed('fail' as const)),
    )
    const redisCheck = Effect.tryPromise(() => redis.ping()).pipe(
      Effect.timeout('2 seconds'),
      Effect.as('ok' as const),
      Effect.catchAll(() => Effect.succeed('fail' as const)),
    )

    return {
      report: Effect.all({ postgres: postgresCheck, redis: redisCheck }, { concurrency: 2 }).pipe(
        Effect.map((checks) => ({
          healthy: checks.postgres === 'ok' && checks.redis === 'ok',
          checks,
        })),
      ),
    }
  }),
)
