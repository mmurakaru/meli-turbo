# ADR 0003 - Persistence via @effect/sql-drizzle

Status: Accepted
Ticket: [meli-turbo#153](https://github.com/mmurakaru/meli-turbo/issues/153)

## Context

Cortex uses `drizzle-orm/postgres-js` with one schema (`sheet_jobs`), five queries in
`SheetJobRepository`, and drizzle-kit migrations. In Effect, the options were:
(A) `@effect/sql` + `@effect/sql-pg` with raw `sql` templates and `PgMigrator`,
dropping drizzle; (B) `@effect/sql-drizzle`, keeping the drizzle schema and
drizzle-kit; (C) plain drizzle wrapped in `Effect.tryPromise`.

## Decision

Use **`@effect/sql-drizzle`** (option B) over `@effect/sql-pg`. Keep the drizzle
schema definitions and drizzle-kit migrations unchanged. The Postgres pool is a
scoped `PgClient.layer`; drizzle queries execute through the Effect `SqlClient` and
fail with `SqlError` in the typed error channel. Transactions use
`SqlClient.withTransaction` (rolls back on failure and interruption, supports
savepoint nesting), not drizzle's promise-callback `db.transaction`.

The driver moves from `postgres-js` to node-postgres (`pg`), which `@effect/sql-pg`
depends on.

## Rationale

- Lowest-friction idiomatic path for an existing drizzle repository: schema and
  migrations are untouched, and queries gain Effect composition, interruption
  safety, and typed errors.
- Option C (`Effect.tryPromise` around `db.transaction`) makes a transaction one
  opaque promise - no Effect composition or interruption inside it, which defeats
  the main reason to adopt Effect here.
- Option A means rewriting all queries as raw `sql` and migrating to `PgMigrator`,
  losing the drizzle schema and migration history for a 5-query service.

## Consequences

- All `@effect/sql*` packages are 0.x and version in lockstep with `effect`;
  breaking changes land on minor bumps. Pin exact versions.
- A known type incompatibility exists between `@effect/sql-drizzle` 0.51 and
  drizzle-orm 0.45.x ([Effect-TS/effect#5904](https://github.com/Effect-TS/effect/issues/5904),
  `Property 'config' is protected`); the workaround is narrow `as any` casts at the
  drizzle call sites. The skeleton applies this in `ExampleRepository.ts`. Remove the
  casts when the peer range moves past drizzle-orm 0.50.
- `SqlError` wraps the underlying driver error as its `cause`; concrete Postgres
  error inspection (e.g. unique-violation code) reads `cause`, not a typed union.
