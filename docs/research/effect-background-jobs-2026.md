# Background jobs in Effect (2026): BullMQ wrapped vs @effect/cluster + @effect/workflow

Research resolving [issue #154](https://github.com/mmurakaru/meli-turbo/issues/154).
All sources verified against primary sources on 2026-07-19. No claims from training data.

## Context

`services/cortex` runs a single BullMQ queue (Redis-backed, concurrency 5) through
`@lokalise/background-jobs-common` (`AbstractBackgroundJobProcessorNew`). Postgres
(`sheet_jobs` via `SheetJobRepository`) is the job-state source of truth; Redis holds a
result cache with a 1-hour TTL (`sheet-job:<jobId>`, `EX 3600`). The question: for a 2026
Effect-based architecture, should the spec keep BullMQ wrapped in Effect Layers, adopt
`@effect/cluster` + `@effect/workflow`, or pick another current option?

## Recommendation

**Wrap BullMQ directly in Effect Layers (option a).** Do not adopt `@effect/cluster` +
`@effect/workflow` for this system. They are pre-1.0 / explicitly "unstable", require
SQL-backed cluster infrastructure (runner + message storage, DB advisory locks), and deliver
distributed multi-node durable orchestration that a single queue at concurrency 5 does not
need. The existing Redis(BullMQ)+Postgres hybrid already provides at-least-once delivery plus
a Postgres source of truth. Confidence: **high**.

## 1. Production-readiness of @effect/cluster and @effect/workflow (mid-2026)

Current npm versions (`npm view` / registry, 2026-07-19):

- `@effect/cluster` **0.60.0** (published 2026-07-13). First release (0.0.1) was June 2024 —
  still pre-1.0 after ~2 years. <https://registry.npmjs.org/@effect/cluster>
- `@effect/workflow` **0.19.0** (published 2026-07-13). Pre-1.0.
  <https://registry.npmjs.org/@effect/workflow>, <https://www.npmjs.com/package/@effect/workflow>
- `effect` **3.22.0** latest stable (2026-07-17); `4.0.0-beta.99` on the `beta` tag.
  <https://registry.npmjs.org/effect>
- `bullmq` **5.80.9** (2026-07-18). <https://registry.npmjs.org/bullmq>

Weekly downloads (npm downloads API, week ending 2026-07-18): `bullmq` **6,690,245**;
`@effect/cluster` **447,849**; `@effect/workflow` **394,345**; `pg-boss` 934,616 — roughly a
15x adoption gap in favour of BullMQ.
<https://api.npmjs.org/downloads/point/last-week/bullmq> (same endpoint per package).

Maintainer stability position — Effect v4 Beta release blog, verbatim:

- "If you're running Effect in production, v3 remains our recommended choice for now."
- Workflow/clustering ship as "unstable modules" under `effect/unstable/*`; "Modules under
  `effect/unstable/*` may receive breaking changes in minor releases."
- The v4 beta ships 17 unstable modules covering "AI, HTTP, Schema, SQL, RPC, CLI, workflows,
  clustering, and more."

Source: <https://effect.website/blog/releases/effect/40-beta/>.
Corroboration (InfoQ): <https://www.infoq.com/news/2026/04/effect-v4-beta/>.

On both lines the modules carry an explicit expect-breaking-changes contract: the v3 line is
pre-1.0 (0.x), and the v4 line lives in the `unstable` namespace. Monorepo release cadence is
fast, which for 0.x / unstable means frequent breaking changes.

## 2. Durable execution semantics vs the Redis+Postgres hybrid

`@effect/workflow` is a genuine durable-execution engine in the Temporal/Restate class: a
deterministic workflow execution ID; an **Activity** is a durable step whose result is
persisted on first completion and replayed on retry; durable primitives `DurableDeferred`
(suspend on external event), `DurableClock` (durable sleep), and `DurableQueue`; built-in
**saga/compensation** finalizers that run on failure; state checkpointed after each activity so
suspended workflows resume from the last checkpoint.
<https://github.com/Effect-TS/effect/tree/main/packages/workflow>

Persistence backend: the production engine is `ClusterWorkflowEngine`, which maps each
workflow to a cluster **Entity** and persists all messages via **MessageStorage**. The SQL
implementation is `SqlMessageStorage` (+ `SqlRunnerStorage`) built on `@effect/sql`, so
**Postgres is supported** (via `@effect/sql-pg`), as are MySQL/SQLite. **There is no
Redis-backed durable store** for workflow/cluster — durability is SQL-only.
<https://effect-ts.github.io/effect/docs/cluster>

That SQL/Postgres durability overlaps the Postgres state machine cortex already treats as the
source of truth. Adopting `@effect/workflow` would mean re-homing job state into its message
store rather than the existing `sheet_jobs` table — a rewrite, not an add-on. The current
Redis(BullMQ)+Postgres hybrid already gives at-least-once delivery plus an
application-owned Postgres state model, which is simpler and already designed.

## 3. Retry / backoff idioms

- **BullMQ native (delivery-level retries, recommended):** `attempts > 1` with `backoff` —
  `fixed` (`delay` ms, optional jitter) or `exponential` (`2^(attemptsMade-1) * delay` ms,
  optional jitter), set via `defaultJobOptions` or per-job in `add()`. Custom strategies via
  `worker.settings.backoffStrategy(attemptsMade, type, err, job)` returning ms, `0` (re-queue
  respecting priority), or `-1` (fail without retry). Retried jobs respect priority.
  <https://docs.bullmq.io/guide/retrying-failing-jobs>
- **`Effect.Schedule`:** best for retries *inside* a single job attempt (transient I/O). Do not
  use it to replace BullMQ attempt tracking — `Effect.Schedule` retries are in-memory and die
  with the process, whereas BullMQ attempt counts survive worker crashes and restarts.
- **Workflow-level retry policies** exist but only apply if the durable engine is adopted.

Split of responsibility: BullMQ owns attempts + backoff across process restarts;
`Effect.Schedule` owns fine-grained in-attempt transient retries.

## 4. Graceful shutdown

- **BullMQ:** `worker.close()` marks the worker as closing (stops new job pickups) and waits
  for in-flight jobs to finish or fail; it does not time out on its own. Idiom:
  `process.on('SIGTERM', async () => { await worker.close(); process.exit(0) })`. For long
  jobs, AbortSignal-based job cancellation lets active jobs abort early so `close()` returns
  faster. This wraps cleanly in an Effect **Layer with a `Scope` finalizer** that calls
  `worker.close()`. <https://docs.bullmq.io/guide/workers/graceful-shutdown>,
  <https://docs.bullmq.io/guide/going-to-production>
- **Cluster:** shutdown means shard rebalancing / ownership hand-off, not just closing a worker
  — materially more moving parts.

## 5. Cluster infrastructure and operational cost

Modern `@effect/cluster` **no longer requires a dedicated Shard Manager process**; it uses
**RunnerStorage + database advisory locks** to negotiate shard ownership. Caveat: advisory
locks **require stable DB sessions** — connection-rotating proxies (e.g. PgBouncer in
transaction pooling mode) can break shard-lock ownership. Components include Runners (`Runner`,
`RunnerHealth`, `HttpRunner` / `SocketRunner` / `SingleRunner`), Sharding config (`Sharding`,
`ShardId`), Entity management (`Entity`, `EntityAddress`), `MessageStorage` /
`SqlMessageStorage`, and `SqlRunnerStorage`. Net: adopting cluster means SQL-backed
runner/message storage, entity sharding, and advisory-lock connection discipline — real
operational surface that is unjustified for one queue at concurrency 5.
<https://effect-ts.github.io/effect/docs/cluster>. Cluster positioning/announcement
(maintainer, X/Effect): <https://x.com/EffectTS_/status/1922246618285318472>

## 6. Other current 2026 options

- **pg-boss** (~934k weekly downloads): a Postgres-only job queue — attractive if Redis were
  dropped, but cortex uses Redis as the result cache, so BullMQ keeps a single Redis serving
  both queue and cache. <https://www.npmjs.com/package/pg-boss>
- **Temporal / Restate TS SDKs:** full durable-execution platforms, Effect interop via
  `Effect.tryPromise`; both require heavy external infrastructure (Temporal server / Restate
  runtime) and are overkill here.
  <https://temporal.io/blog/what-is-durable-execution>,
  <https://www.restate.dev/what-is-durable-execution>
- **Effect-native:** `@effect/cluster` + `@effect/workflow` is the only first-party option (the
  pre-1.0 / unstable one above). No widely-adopted community "Effect + BullMQ" package exists;
  the idiomatic path is a thin hand-written Layer wrapping BullMQ `Queue` / `Worker`.

## Cost of deleting @lokalise/background-jobs-common

`@lokalise/background-jobs-common` (`^14.4.0`) currently provides
`AbstractBackgroundJobProcessorNew`, `CommonBullmqFactoryNew`, queue-manager wiring, the
`BASE_JOB_PAYLOAD_SCHEMA`, spy/test helpers, and observability integration
(`transactionObservabilityManager`) that cortex uses through `AbstractEnqueuedJobProcessor`.
Replacing it with a bespoke Effect Layer means re-implementing worker/queue lifecycle,
payload-schema plumbing, error reporting, and test doubles by hand. It is feasible (BullMQ is a
thin surface), but it is real work and gives up the shared observability/test tooling — worth
doing only if the Effect migration specifically requires Layer-native lifecycle rather than the
class-based abstraction.

## Suggested spec shape

`QueueLayer` (provides `Queue`, closed via a `Scope` finalizer) + `WorkerLayer` (provides
`Worker`, `worker.close()` in the finalizer, SIGTERM-driven). BullMQ owns attempts + backoff;
`Effect.Schedule` owns in-attempt transient retries; Postgres stays the job-state source of
truth; Redis stays the queue plus the 1-hour result cache. Revisit `@effect/workflow` only if
multi-step saga orchestration with durable timers becomes a real requirement — and even then,
wait until it leaves the `unstable` / 0.x contract.

## Sources

- Effect v4 Beta release blog (stability statements): <https://effect.website/blog/releases/effect/40-beta/>
- InfoQ, Effect v4 Beta: <https://www.infoq.com/news/2026/04/effect-v4-beta/>
- `@effect/cluster` npm registry: <https://registry.npmjs.org/@effect/cluster>
- `@effect/workflow` npm registry: <https://registry.npmjs.org/@effect/workflow>
- `effect` npm registry: <https://registry.npmjs.org/effect>
- `bullmq` npm registry: <https://registry.npmjs.org/bullmq>
- npm downloads API: <https://api.npmjs.org/downloads/point/last-week/bullmq>
- Effect cluster/workflow API docs: <https://effect-ts.github.io/effect/docs/cluster>
- `@effect/workflow` source: <https://github.com/Effect-TS/effect/tree/main/packages/workflow>
- BullMQ retrying failing jobs: <https://docs.bullmq.io/guide/retrying-failing-jobs>
- BullMQ graceful shutdown: <https://docs.bullmq.io/guide/workers/graceful-shutdown>
- BullMQ going to production: <https://docs.bullmq.io/guide/going-to-production>
- Effect cluster announcement (X): <https://x.com/EffectTS_/status/1922246618285318472>
- pg-boss: <https://www.npmjs.com/package/pg-boss>
- Temporal durable execution: <https://temporal.io/blog/what-is-durable-execution>
- Restate durable execution: <https://www.restate.dev/what-is-durable-execution>
