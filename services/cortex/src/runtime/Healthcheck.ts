import { Context, Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'
import { RedisConnection } from './Redis.ts'

export type HealthReport = {
  readonly healthy: boolean
  readonly checks: { readonly postgres: 'ok' | 'fail'; readonly redis: 'ok' | 'fail' }
}

export class Healthcheck extends Context.Service<
  Healthcheck,
  { readonly report: Effect.Effect<HealthReport> }
>()('Healthcheck') {}

export const HealthcheckLive = Layer.effect(
  Healthcheck,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const redis = yield* RedisConnection

    const postgresCheck = sql`SELECT 1`.pipe(
      Effect.timeout('2 seconds'),
      Effect.as('ok' as const),
      Effect.catch(() => Effect.succeed('fail' as const)),
    )
    const redisCheck = Effect.tryPromise(() => redis.ping()).pipe(
      Effect.timeout('2 seconds'),
      Effect.as('ok' as const),
      Effect.catch(() => Effect.succeed('fail' as const)),
    )

    return {
      report: Effect.all({ postgres: postgresCheck, redis: redisCheck }, { concurrency: 2 }).pipe(
        Effect.map(({ postgres, redis }) => ({
          healthy: postgres === 'ok' && redis === 'ok',
          // Rebuilt in a fixed order: Effect 4's concurrent Effect.all fills struct keys in
          // completion order, which would make the JSON key order of /health vary.
          checks: { postgres, redis },
        })),
      ),
    }
  }),
)
