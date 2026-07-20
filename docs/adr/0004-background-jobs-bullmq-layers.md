# ADR 0004 - Background jobs: BullMQ wrapped in Effect Layers

Status: Accepted
Ticket: [meli-turbo#154](https://github.com/mmurakaru/meli-turbo/issues/154)

## Context

Cortex runs one BullMQ queue (Redis-backed, concurrency 5) via
`@lokalise/background-jobs-common`, with the Postgres `sheet_jobs` table as the
job-state source of truth and a Redis result cache. The Effect-native option is
`@effect/cluster` + `@effect/workflow` (durable execution). The choice: wrap BullMQ
directly, or adopt the Effect cluster/workflow engine.

## Decision

**Wrap BullMQ in Effect Layers.** A queue layer provides the `Queue` (closed via a
Scope finalizer); a worker layer provides the `Worker` whose processor captures the
Effect runtime and runs each job as a full Effect (traced, logged, error-reported),
closing via `worker.close()` in a finalizer. BullMQ owns cross-process attempts and
backoff; `Effect.Schedule` handles transient in-attempt retries only.

Do not adopt `@effect/cluster` / `@effect/workflow`.

## Rationale

- `@effect/cluster` (0.60) and `@effect/workflow` (0.19) are pre-1.0 / explicitly
  unstable; Effect's own guidance is that v3 is the production recommendation.
- Their durability is SQL-backed and would duplicate the Postgres `sheet_jobs`
  source of truth cortex already maintains.
- Their runner/entity-sharding/advisory-lock machinery is unjustified operational
  surface for a single queue at concurrency 5.
- BullMQ keeps native attempt tracking that survives worker crashes; `worker.close()`
  wraps cleanly in a Scope finalizer for deterministic graceful shutdown.

## Consequences

- `@lokalise/background-jobs-common` is removed; the queue/worker layers are ~100
  lines the service owns.
- BullMQ and ioredis remain direct dependencies (vendor-neutral).
- The existing Redis + Postgres hybrid state model is preserved unchanged.

## Revisit when

Multi-step saga orchestration with durable timers becomes a real requirement, and
`@effect/workflow` has left the unstable / 0.x contract.
