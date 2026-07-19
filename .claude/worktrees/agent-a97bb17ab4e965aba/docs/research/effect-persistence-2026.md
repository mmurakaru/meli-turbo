# Effect persistence: @effect/sql(-drizzle) vs wrapping Drizzle

Research resolving [issue #153](https://github.com/mmurakaru/meli-turbo/issues/153).
Date: 2026-07-19. All facts verified against primary sources (npm registry, Effect API docs, Effect GitHub) on that date.

## Question

For an Effect-based rewrite of `services/cortex` Postgres access, choose among:

- **Option A** — `@effect/sql` + `@effect/sql-pg` (drop drizzle, use raw `sql` template API)
- **Option B** — `@effect/sql-drizzle` (drizzle query builder on top of the Effect `SqlClient`)
- **Option C** — plain `drizzle-orm` wrapped in `Effect.tryPromise`

Context: cortex today uses `drizzle-orm/postgres-js`, one schema (`sheet_jobs`), five queries in
`services/cortex/src/modules/sheets/services/SheetJobRepository.ts` (`create`, `setProcessing`,
`setCompleted`, `setFailed`, `findById`), and drizzle-kit migrations. The drizzle instance is a
singleton in `CommonModule.ts` disposed via `drizzle.$client.end()`.

## Recommendation

**Option B — `@effect/sql-drizzle`. Confidence: high.**

It is the lowest-friction idiomatic Effect path for a small drizzle repository: the existing drizzle
schema and drizzle-kit migrations stay untouched, the connection pool becomes a scoped `PgClient`
Layer, transactions compose through `SqlClient.withTransaction` with rollback on failure and on
interruption, and `SqlError` populates the typed error channel for free. The two costs are living
with 0.x churn (pin exact versions) and validating the drizzle-orm 0.45.x type-compat caveat below.

Pick A only if the goal is to shed drizzle entirely for raw `sql` plus `PgMigrator` (larger rewrite,
loses existing migration history). Avoid C: it can run a transaction, but forfeits interruption
safety and in-transaction Effect composition, which is the main reason to adopt Effect at all.

## 1. Package maturity (npm, verified 2026-07-19)

| Package | Current version | Published | Line |
|---|---|---|---|
| `effect` | 3.22.0 | 2026-07-17 | stable 3.x |
| `@effect/sql` | 0.52.0 | 2026-07-13 | 0.x |
| `@effect/sql-pg` | 0.53.0 | 2026-07-13 | 0.x |
| `@effect/sql-drizzle` | 0.51.0 | 2026-07-13 | 0.x |
| `drizzle-orm` | 0.45.2 | 2026-07-17 | 0.x |
| `drizzle-kit` | 0.31.10 | 2026-06-27 | 0.x |

All `@effect/sql*` packages are still 0.x, versioned in lockstep, and released together with each
`effect` minor (routinely breaking). They are actively maintained (releases at least monthly; latest
2026-07-13) but pre-1.0 in versioning. A parallel `@effect/sql-pg@4.0.0-beta.99` (2026-07-17) exists —
the Effect v4 rewrite, still beta — so the stable choice today is the 0.5x line on effect 3.22.

Peer dependencies (`npm view … peerDependencies`):

- `@effect/sql@0.52.0` → `effect ^3.22.0`, `@effect/platform ^0.97.0`, `@effect/experimental ^0.61.0`
- `@effect/sql-pg@0.53.0` → `effect ^3.22.0`, `@effect/sql ^0.52.0`, `@effect/platform ^0.97.0`, `@effect/experimental ^0.61.0`
- `@effect/sql-drizzle@0.51.0` → `drizzle-orm ">=0.43.1 <0.50"`, `@effect/sql ^0.52.0`, `effect ^3.22.0`

Cortex's current `drizzle-orm@0.45.2` is inside that range. Note the upper bound `<0.50`: a future
drizzle-orm 0.50 would require an `@effect/sql-drizzle` bump.

**Driver change.** `@effect/sql-pg` uses node-postgres `pg` (deps: `pg@^8.16.3`, `pg-pool`,
`pg-types`, `pg-cursor`, `pg-connection-string`), **not** postgres-js. Cortex currently runs
`drizzle-orm/postgres-js` with `postgres@^3.4.8`. Options A and B route through `pg`; drizzle-orm
0.45.2 supports both `pg` and `postgres` peers, so the schema is unaffected, but the runtime driver
and the `CommonModule` client-construction change.

## 2. drizzle-kit migration compatibility

- **Options B and C:** the schema stays defined in drizzle (`pgTable`), so `drizzle-kit generate` /
  `drizzle-kit migrate` and the existing `sheet_jobs` migrations keep working unchanged.
- **Option A:** drop drizzle and either keep drizzle-kit purely for SQL generation, or adopt
  `@effect/sql`'s `PgMigrator` (`PgMigrator.layer({ loader: PgMigrator.fromFileSystem(...), table: "…" })`),
  which tracks applied migrations in its own table (default `effect_sql_migrations`) using
  forward-only TypeScript-Effect migration files. Running two migration systems for one 5-query
  service is not worth it.

## 3. Transaction semantics in Effect

- `SqlClient.withTransaction` signature (verified): `<R,E,A>(self: Effect<A,E,R>) => Effect<A, E | SqlError, R>`.
  It wraps all SQL in one BEGIN/COMMIT, rolls back on failure **and on interruption**, and nests via
  savepoints (the internal `makeWithTransaction` carries `savepoint` / `rollbackSavepoint` params).
  It is fully composable: any Effect run inside enrolls in the same transaction through a scoped
  connection.
- **Option B:** `@effect/sql-drizzle` patches drizzle so queries run through the same Effect
  `SqlClient` / connection; the recommended transaction path is wrapping drizzle calls in
  `SqlClient.withTransaction`. Drizzle's own `db.transaction(async tx => …)` is a plain Promise
  callback, not the Effect-integrated path, so prefer `withTransaction`.
  Caveat: [issue #5904](https://github.com/Effect-TS/effect/issues/5904) (closed) reports a **type**
  incompatibility between `@effect/sql-drizzle` and drizzle-orm 0.45.x (a `$columns` protected-property
  mismatch), with an `as any` workaround on table args. Validate that the `0.51.0` + `0.45.2` pair
  type-checks cleanly before committing to the rewrite.
- **Option C:** wrapping `db.transaction` in one `Effect.tryPromise` makes the whole transaction one
  opaque promise. You lose Effect composition inside the callback (no yielding Effects, no typed
  per-step errors, no Effect retry/tracing), and interruption does not propagate into the running
  promise, so an interrupt will not cleanly roll back mid-flight.

## 4. Connection pool lifecycle as a scoped Layer

- `PgClient.layer(config)` → `Layer<PgClient | SqlClient, SqlError>`;
  `PgClient.layerConfig(config)` → `Layer<PgClient | SqlClient, ConfigError | SqlError>` (verified).
  Both are scoped Layers: they acquire the `pg` pool on construction and release it on Scope close —
  automatic lifecycle, replacing the manual `dispose: (drizzle) => drizzle.$client.end()` in
  `CommonModule.ts`. Config fields include `url` (Redacted), `host`/`port`/`database`,
  `username`/`password` (Redacted), `maxConnections`, `minConnections`, `idleTimeout`,
  `connectTimeout`, `connectionTTL`, `ssl`, and name-transform options.
- **Option B** reuses this same `PgClient` layer (drizzle sits on top of it). **Option C** requires
  hand-managing the postgres-js client via `Effect.acquireRelease`.

## 5. Typed error channels

- `@effect/sql` exposes `SqlError` (carries a `SqlErrorTypeId` symbol and `_tag`) plus
  `ResultLengthMismatch`. `SqlError` holds the driver error as `cause`, typed as unknown/wrapped —
  **not** a driver-specific typed union — so to branch on a concrete Postgres condition (e.g. a
  unique-violation `code`) you inspect `cause`. Options A and B surface `SqlError` automatically.
- **Option C** gives whatever tagged error you define (e.g.
  `Data.TaggedError("DatabaseError")<{ cause: unknown }>`) — full control, but you write and maintain
  the mapping yourself.

## Migration sketch for cortex (Option B)

1. Add `@effect/sql`, `@effect/sql-pg`, `@effect/sql-drizzle` (pin exact 0.5x versions), keep
   `drizzle-orm` / `drizzle-kit` and the `sheet_jobs` schema and migrations as-is.
2. Replace the `CommonModule` drizzle singleton with a scoped `PgClient.layerConfig` plus the
   `@effect/sql-drizzle` layer; drop the manual `$client.end()` disposer (Scope handles it).
3. Rewrite the five `SheetJobRepository` methods to return `Effect<…, SqlError>`, using drizzle
   query builders through the patched client; wrap any multi-statement flow in
   `SqlClient.withTransaction`.
4. Verify the drizzle-orm 0.45.x type-compat (#5904) compiles; if not, apply the documented `as any`
   workaround or hold drizzle-orm at a version the peer range and types accept.

## Sources (verified 2026-07-19)

- npm registry: `npm view <pkg> version time peerDependencies dependencies --json` for `effect`,
  `@effect/sql`, `@effect/sql-pg`, `@effect/sql-drizzle`, `drizzle-orm`, `drizzle-kit`.
- https://effect-ts.github.io/effect/sql-pg/PgClient.ts.html — `layer` / `layerConfig` scoped Layers, `PgClientConfig` fields.
- https://effect-ts.github.io/effect/sql/SqlClient.ts.html — `withTransaction` signature and savepoint params.
- https://effect-ts.github.io/effect/sql/SqlError.ts.html — `SqlError`, `SqlErrorTypeId`, `ResultLengthMismatch`.
- https://github.com/Effect-TS/effect/blob/main/packages/sql-pg/src/PgMigrator.ts — `PgMigrator` exists.
- https://github.com/Effect-TS/effect/issues/5904 — drizzle-orm 0.45.x type incompatibility (closed; `as any` workaround).
- https://github.com/Effect-TS/effect/issues/6006 — `withTransaction` issues BEGIN/COMMIT/ROLLBACK SQL.
