import type { DrizzleConfig } from 'drizzle-orm'
import { drizzle, type PgRemoteDatabase } from 'drizzle-orm/pg-proxy'
import { Cause, Context, Effect, Exit, Layer } from 'effect'
import { SqlClient, SqlError } from 'effect/sql'

/**
 * Drizzle on top of Effect's SqlClient.
 *
 * This is a local port of `@effect/sql-drizzle/Pg` (Effect 3), which has no Effect 4
 * release. Drizzle's `pg-proxy` driver hands every compiled query to a callback; the
 * callback runs it through the Effect `SqlClient` (so pooling, spans and the scoped
 * connection lifecycle stay with `@effect/sql-pg`), and Drizzle maps the rows back.
 *
 * The one difference from the v3 package: queries are not patched into Effects. Wrap a
 * query in `runQuery(...)` to execute it as an `Effect<A, SqlError>`.
 */
export class PgDrizzle extends Context.Service<PgDrizzle, PgRemoteDatabase>()(
  '@effect/sql-drizzle/Pg',
) {}

// Services of the fiber currently executing a query, so the SqlClient statement runs
// with the caller's context (span parent, annotations). Drizzle calls the proxy
// callback synchronously from `execute()`, so a save/restore around it is enough.
let currentServices: Context.Context<never> | undefined

type ProxyMethod = 'all' | 'execute'

const makeRemoteCallback = Effect.gen(function* () {
  const client = yield* SqlClient.SqlClient
  const constructionServices = yield* Effect.context<never>()
  return (sql: string, params: Array<unknown>, method: ProxyMethod) => {
    const services = currentServices ?? constructionServices
    const statement = client.unsafe(sql, params)
    const effect: Effect.Effect<{ rows: Array<unknown> }, SqlError.SqlError> =
      method === 'execute'
        ? Effect.map(statement.raw, (header) => ({ rows: [header] }))
        : Effect.map(statement.values, (rows) => ({ rows: rows as Array<unknown> }))
    return Effect.runPromiseExitWith(services)(effect).then((exit) => {
      if (Exit.isSuccess(exit)) {
        return exit.value
      }
      throw Cause.squash(exit.cause)
    })
  }
})

export const make = <TSchema extends Record<string, unknown> = Record<string, never>>(
  config?: Omit<DrizzleConfig<TSchema>, 'logger'>,
): Effect.Effect<PgRemoteDatabase<TSchema>, never, SqlClient.SqlClient> =>
  Effect.map(makeRemoteCallback, (callback) => drizzle(callback, config))

export const layer: Layer.Layer<PgDrizzle, never, SqlClient.SqlClient> = Layer.effect(
  PgDrizzle,
  make(),
)

/** Executes a Drizzle query (insert/update/select builder) as an Effect. */
export const runQuery = <A>(query: {
  readonly execute: () => Promise<A>
}): Effect.Effect<A, SqlError.SqlError> =>
  Effect.flatMap(Effect.context<never>(), (services) =>
    Effect.tryPromise({
      try: () => {
        const previous = currentServices
        currentServices = services
        try {
          return query.execute()
        } finally {
          currentServices = previous
        }
      },
      catch: (cause) =>
        SqlError.isSqlError(cause)
          ? cause
          : new SqlError.SqlError({
              reason: new SqlError.UnknownError({
                cause,
                message: 'Failed to execute QueryPromise',
              }),
            }),
    }),
  )
