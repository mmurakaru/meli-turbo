import { PgClient } from '@effect/sql-pg'
import { Effect, Layer } from 'effect'
import { AppConfig } from './config.ts'
import * as PgDrizzle from './Drizzle.ts'

/**
 * Postgres access as a scoped Layer: `PgClient.layer` owns the connection pool
 * (acquired and released with the runtime scope), and `PgDrizzle.layer` exposes a
 * drizzle query builder whose queries run as Effects (via `PgDrizzle.runQuery`)
 * failing with `SqlError`.
 */
export const DatabaseLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig
    return PgDrizzle.layer.pipe(
      Layer.provideMerge(
        PgClient.layer({
          url: config.database.url,
          maxConnections: config.database.maxConnections,
        }),
      ),
    )
  }),
)

export { PgDrizzle }
