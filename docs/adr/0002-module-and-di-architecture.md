# ADR 0002 - Module and dependency-injection architecture

Status: Accepted
Ticket: [meli-turbo#156](https://github.com/mmurakaru/meli-turbo/issues/156)

## Context

`opinionated-machine` gives cortex its enterprise structure: self-contained modules
that declare their services, controllers, and job workers, with a public/private
dependency distinction and lifecycle ordering via `asyncInit`/`dispose` priorities,
all over an Awilix container. Removing `opinionated-machine` (and `awilix`,
`awilix-manager`, `@fastify/awilix`) must preserve that structure in Effect.

## Decision

**Per-module Layer bundles.** Each module exports one composed `Layer` (e.g.
`ExampleModuleLive`). The composition root `src/runtime/AppRuntime.ts` merges a
`CommonLive` layer (config, database, redis, queue connection, observability, error
reporting) with each module's layer into `AppLive`, and builds a single
`ManagedRuntime`.

**Module internals are built once and provided inward.** Within a module, the
repository and job-queue layers are merged into a `ModuleInternalsLive` and supplied
to the module's service and worker via `Layer.provide`. This shares a single
instance across service and worker and keeps those internals out of the application
context.

**TypeScript exports are the public/private boundary.** A module's `index.ts`
exports only its composed Layer, its route registrar, and the Tags other modules may
depend on. Repositories and job internals are not exported, so they are
module-private. (A lint rule to make cross-module deep imports an error is a
follow-up - see the migration spec; `biome` 2.5 `noRestrictedImports` does not
accept glob path patterns, so this needs an eslint rule or a custom biome rule.)

**Controllers are route-registrar functions.** Each module exports
`register<Name>Routes(app, runtime)`; handlers build an Effect, run it on the
runtime, and map typed errors to status codes. No controller classes.

**Lifecycle is the Layer graph.** Resource acquisition/release uses `Layer.scoped`
with `Effect.acquireRelease` (redis clients, the pg pool, BullMQ queues/workers).
Startup/teardown ordering is derived from the dependency graph instead of numeric
priorities; `ManagedRuntime.dispose()` runs finalizers in reverse order on shutdown.

**Directory layout:** `src/modules/<name>/{http,services,jobs,schemas}`,
`src/runtime/` (composition root, config, infrastructure layers), `src/db/`.

## Consequences

- The public/private distinction is enforced structurally (and, once the lint rule
  lands, mechanically) rather than by framework registration flags.
- Adding a module is four steps: create the folder, export its Layer + routes from
  `index.ts`, add the Layer to `AppLive`, add the route registrar in `server.ts`.
- No Awilix cradle types or module augmentation; dependencies are ordinary Effect
  `Context.Tag`s resolved through Layers.
- The pattern is proven in the `meli-service-template` walking skeleton
  ([meli-service-template#1](https://github.com/mmurakaru/meli-service-template/pull/1)).
