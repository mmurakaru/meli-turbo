import * as PgDrizzle from '@effect/sql-drizzle/Pg'
import { PgClient } from '@effect/sql-pg'
import { Effect, Layer } from 'effect'
import { AppConfig } from './config.ts'

/**
 * Postgres access as a scoped Layer: `PgClient.layer` owns the node-postgres pool
 * (acquired and released with the runtime scope), and `PgDrizzle.layer` exposes a
 * drizzle query builder whose queries are Effects failing with `SqlError`.
 */
export const DatabaseLive = Layer.unwrapEffect(
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
