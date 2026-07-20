# Cortex Effect.ts migration spec

Executable plan for migrating `services/cortex` off the Lokalise package stack onto
Effect.ts. Built on the decisions in [`adr/`](adr/README.md) and the walking
skeleton in [meli-service-template#1](https://github.com/mmurakaru/meli-service-template/pull/1).
Each phase is independently shippable and leaves the service green (`tsc`, `biome`,
`vitest`, and a booting `/health`).

This spec is the destination of the wayfinder map,
[meli-turbo#151](https://github.com/mmurakaru/meli-turbo/issues/151). A build agent
should be able to execute it end to end from here plus the ADRs.

## Target shape

```
services/cortex/src/
  modules/sheets/
    http/          sheetRoutes.ts (registrar; was controllers/SheetController.ts)
    services/      SheetService.ts, SheetJobRepository.ts
    jobs/          SheetGenerationJob.ts (BullMQ worker layer)
    schemas/       sheetSchemas.ts, sheetApiContracts.ts
    index.ts       exports SheetsModuleLive, registerSheetRoutes, public Tags
  runtime/         AppRuntime.ts, config.ts, Database.ts, Redis.ts, Queue.ts,
                   Observability.ts, Logging.ts, PostHog.ts, Healthcheck.ts,
                   ErrorHandler.ts (typed-error -> reply seam, ADR 0009)
  db/              schema/, migrations/ (unchanged)
  server.ts        Fastify shell: plugins, ManagedRuntime, route registrars
```

The `meli-service-template` `example` module is the reference; `sheets` follows the
same shape one-to-one.

## Phase 0 - Remove dead template scaffolding

Independent of Effect; do first to shrink every later phase. All of the following
are unused in cortex today (empty `amqpSupportedMessages`, no consumer subclasses,
zero imports, or no concrete subclass).

Remove dependencies: `@message-queue-toolkit/{amqp,core,sns,sqs,metrics,schemas}`,
`@aws-sdk/client-{sns,sqs,sts}`, `@aws-sdk/credential-providers`, `amqplib`,
`@lokalise/aws-config`, `layered-loader`, `@lokalise/zod-extras`,
`@lokalise/universal-ts-utils`, `undici`.

Remove files: `infrastructure/AbstractSnsSqsConsumer.ts`,
`infrastructure/AbstractRabbitMQTopicConsumer.ts`,
`infrastructure/PublisherManagerAdapter.ts`, `infrastructure/jobs/AbstractPeriodicJob.ts`
(no concrete subclass; also drops `redis-semaphore` and `toad-scheduler` once the
scheduler registration goes).

Remove from `CommonModule.ts`: the SQS/SNS/STS client registrations, AMQP connection
manager, publisher manager, event registry, consumer error resolvers; the `aws` and
`amqp` config sections in `config.ts`.

Gate: `pnpm lint` and `pnpm test` green; service boots. Ship as one PR.

## Phase 1 - Effect runtime foundation (no behavior change)

Introduce Effect alongside the existing wiring; nothing switches over yet.

1. Add `effect`, `@effect/sql`, `@effect/sql-pg`, `@effect/sql-drizzle`,
   `@effect/opentelemetry`, `@effect/vitest`, `posthog-node`, `pg` (exact pins per
   ADR README). 
2. Create `runtime/config.ts` (ADR 0006): port every env var from
   `infrastructure/config.ts` into nested `Config.all` groups with `Config.redacted`
   for secrets; add the doc-generation + validation scripts. **Both config systems
   run in parallel during the transition** - the old `envase`-based
   `infrastructure/config.ts` still backs the running app, and `envase` is not
   removed until Phase 3. (Removing it here would break this phase's green gate, since
   the old wiring is built on it.)
3. Create the infrastructure layers (ADR 0002, 0003, 0005, 0009): `Database.ts`
   (`PgClient.layer` + `PgDrizzle`), `Redis.ts`, `Queue.ts` (BullMQ connection),
   `Observability.ts`, `Logging.ts`, `PostHog.ts`, `Healthcheck.ts`, and the
   error-seam mapper. These mirror the template's `runtime/` files.
4. Create `runtime/AppRuntime.ts` with `CommonLive` and an empty `AppLive` (modules
   added in Phase 2), building a `ManagedRuntime`.

Gate: layers compile and a `ManagedRuntime` boots in a throwaway script hitting
`/health` logic; existing app still runs on the old wiring (old config + envase
intact).

## Phase 2 - Migrate the sheets module

Rewrite the one business module as Effect (ADR 0002), behind the still-Fastify shell.

**Dual-runtime coexistence (read first).** During this phase the new `ManagedRuntime`
runs *inside* the old Lokalise `app.ts`. That means two of several things are briefly
live at once: two pg pools, two Redis connections, two BullMQ connections. Two
correctness requirements follow, both gated below:

- **Exactly one worker is bound to the sheet queue.** Remove the old `SheetModule`
  from the `opinionated-machine` module list (so its BullMQ worker is not started)
  *in the same change* that starts the new Effect worker. Two workers on one queue
  means double job processing. Verify with the gate.
- **Shutdown disposes both runtimes.** The old app's dispose and
  `ManagedRuntime.dispose()` must both run on shutdown until Phase 3 removes the old
  path.

1. `services/SheetJobRepository.ts`: constructor-injected drizzle -> `Layer.effect`
   over `PgDrizzle`; the five queries become Effects failing with `SqlError`. Apply
   the drizzle 0.45 `as any` workaround (ADR 0003).
2. `services/SheetService.ts`: `generateSheet` becomes an Effect with typed errors
   (`SourceFetchError | AiGenerationError`), `Effect.timeout`, and `Schedule` retry on
   the AI call. `WebFetcherService` becomes an Effect service. (This fixes latent
   gaps: today the source-fetch failure is silently swallowed and the AI call has no
   timeout or retry.)
3. `jobs/SheetGenerationJob.ts`: BullMQ worker layer (ADR 0004) whose processor runs
   the generation Effect; the Redis+Postgres dual-write becomes explicit
   `Effect.zip`/`catchAll` with defined failure semantics. Decide the semantics
   explicitly rather than inheriting the current implicit ones - the rewrite should
   fix the latent gaps: (a) insert-then-enqueue is not atomic today, so an enqueue
   failure orphans a `pending` row (choose: accept the orphan with a reaper, or an
   outbox); (b) a nonexistent jobId currently reads back as `pending`,
   indistinguishable from queued (choose: distinguish unknown vs pending); (c) status
   transitions are blind UPDATEs - use compare-and-set so a late/duplicate write
   cannot regress a terminal state.
4. `http/sheetRoutes.ts`: `SheetController` becomes `registerSheetRoutes(app, runtime)`;
   the two handlers build Effects and `runtime.runPromise` them. Keep the Zod
   contracts in `schemas/`.
5. `modules/sheets/index.ts`: export `SheetsModuleLive` (internals provided inward),
   `registerSheetRoutes`, and public Tags. Add `SheetsModuleLive` to `AppLive`.
6. Unit tests via `@effect/vitest`; port the e2e specs to a test `ManagedRuntime`
   (ADR 0007).

Gate: full `vitest` (unit + integration against real pg/redis) green;
`POST /sheets/generate` -> job -> `GET /sheets/jobs/:id` verified end to end; and
**exactly one worker is bound to the sheet queue** (confirm the old
`opinionated-machine` worker is not started - e.g. a single job produces a single
Postgres state transition, not two).

## Phase 3 - Replace the Fastify shell internals

Swap the remaining `@lokalise` plumbing in `app.ts`/`server.ts` for the Effect
layers and direct plugins (ADR 0001, 0005, 0009). This is the riskiest phase; it may
be split into two PRs - **3a observability + error seam** (metrics, error handler,
logging, request context, OTel, healthchecks) and **3b DI removal** (drop
opinionated-machine/awilix and the old app path) - so a regression in the
observability swap does not force reverting the DI removal.

- Error handling: `createErrorHandler` (`@lokalise/fastify-extras`) -> the central
  error seam (ADR 0009): `setErrorHandler` + `setNotFoundHandler` running the typed
  mapper and capturing to PostHog.
- Metrics: drop the `@lokalise/fastify-extras` metrics plugin; the Prometheus
  exporter from `Observability.ts` serves `/metrics` on :9080.
- Error reporting / analytics: Bugsnag + Amplitude -> the PostHog layer.
- Logging: `resolveMonorepoLogger`/pino -> Effect `Logger` (stdout).
- Request context: `requestContextProviderPlugin` -> `FiberRef` annotations, with the
  request id bridged in the handler adapter (ADR 0005).
- OTel: `@lokalise/opentelemetry-fastify-bootstrap` -> `@effect/opentelemetry`, keeping
  `@opentelemetry/auto-instrumentations-node` (or the http/pg/redis instrumentations)
  so trace coverage does not narrow (ADR 0005).
- Healthchecks: `@lokalise/healthcheck-utils` -> the hand-rolled `Healthcheck` layer.
- IDs: `@lokalise/id-utils` -> the `uuidv7` package (or `node:crypto` randomUUID).
- Config: remove `envase` here (the new `Effect.Config` has backed the service since
  Phase 1; this deletes the now-unused old config path).
- Keep `@fastify/jwt` (RS256), `@fastify/helmet`, `@fastify/cors`, `@fastify/swagger`,
  Scalar, `fastify-type-provider-zod`.

Remove `opinionated-machine`, `awilix`, `awilix-manager`, `@fastify/awilix`,
`@lokalise/fastify-extras`, `@lokalise/node-core`, `@lokalise/healthcheck-utils`,
`@lokalise/opentelemetry-fastify-bootstrap`, `@lokalise/background-jobs-common`,
`@lokalise/fastify-api-contracts` (see note), `@lokalise/id-utils`, `envase`.

Note on `@lokalise/api-contracts` / `fastify-api-contracts`: these back the Zod route
contracts. If keeping them is acceptable (they are HTTP-contract helpers, not part of
the DI/observability coupling), they can stay; otherwise replace with plain
`fastify-type-provider-zod` route definitions as the skeleton does. Decide at
implementation - the skeleton demonstrates the dependency-free form.

Gate: no `@lokalise/*` (except any consciously-kept contract helper) in
`package.json`; `/health`, `/metrics`, `/documentation`, and both sheet routes work;
graceful shutdown disposes the runtime.

## Phase 4 - Follow-ups (not blocking the migration)

- Cross-module deep-import lint rule (ADR 0002) - eslint or a custom biome rule, since
  biome 2.5 `noRestrictedImports` lacks glob paths.
- Remove the drizzle `as any` casts once `@effect/sql-drizzle` supports drizzle-orm
  >= 0.50 (ADR 0003).
- Reconsider `@effect/platform` HttpApi if a shared contracts package + typed-client
  consumer appears and HttpApi reaches 1.0 (ADR 0001).
- Per-module config fragments: `runtime/config.ts` centralizes every module's env
  vars (and the env-docs registry is a module-level array filled by import side
  effects). Fine at current scale, but it is the one place that does not follow the
  per-module boundary of ADR 0002 - revisit with a per-module config-fragment seam if
  module count grows.

## Rollback points

Each phase is a separate PR on its own branch. Phases 0 and 1 are additive/subtractive
without switching behavior, so they roll back by revert. Phase 2 switches the sheets
module over; if it regresses, revert the module PR - the shell still runs the old
wiring until Phase 3. Phase 3 is the point of no return for `@lokalise/*` removal;
keep it a single reviewable PR so it reverts atomically.

## Definition of done

- `services/cortex/package.json` free of `opinionated-machine`, `@message-queue-toolkit/*`,
  and `@lokalise/*` observability/DI/jobs packages.
- Business logic, DI, jobs, config, and observability all expressed in Effect.
- `tsc` + `biome` + `vitest` green; the service boots and serves the two sheet routes,
  `/health`, `/metrics`, and `/documentation`.
- cortex structurally matches `meli-service-template` (ADR 0008).
