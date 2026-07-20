# Architecture Decision Records

Decisions for migrating `services/cortex` off the Lokalise package stack onto
Effect.ts, and for the `meli-service-template` skeleton derived from them.

Each ADR states the context, the decision, and its consequences. They were charted
and resolved on the wayfinder map, [meli-turbo#151](https://github.com/mmurakaru/meli-turbo/issues/151);
the linked ticket on each ADR holds the original discussion and evidence.

| ADR | Decision | Ticket |
|---|---|---|
| [0001](0001-adopt-effect-with-fastify-shell.md) | Adopt Effect.ts behind a Fastify 5 shell + ManagedRuntime | [#152](https://github.com/mmurakaru/meli-turbo/issues/152) |
| [0002](0002-module-and-di-architecture.md) | Per-module Layer bundles; TS-export boundary; route-registrar handlers | [#156](https://github.com/mmurakaru/meli-turbo/issues/156) |
| [0003](0003-persistence-effect-sql-drizzle.md) | Persistence via @effect/sql-drizzle, keeping drizzle-kit migrations | [#153](https://github.com/mmurakaru/meli-turbo/issues/153) |
| [0004](0004-background-jobs-bullmq-layers.md) | Background jobs: BullMQ wrapped in Effect Layers | [#154](https://github.com/mmurakaru/meli-turbo/issues/154) |
| [0005](0005-observability-and-vendors.md) | One OpenTelemetry pipeline; PostHog; Effect Logger | [#155](https://github.com/mmurakaru/meli-turbo/issues/155), [#157](https://github.com/mmurakaru/meli-turbo/issues/157) |
| [0006](0006-configuration.md) | Central Effect.Config with generated env docs | [#162](https://github.com/mmurakaru/meli-turbo/issues/162) |
| [0007](0007-testing-strategy.md) | @effect/vitest units + real-infrastructure integration | [#161](https://github.com/mmurakaru/meli-turbo/issues/161) |
| [0008](0008-template-distribution.md) | GitHub template repo; cortex retrofitted to match | [#163](https://github.com/mmurakaru/meli-turbo/issues/163) |

The executable migration plan built on these decisions is
[`../effect-migration-spec.md`](../effect-migration-spec.md).

## Status legend

`Accepted` - decided and in force. `Superseded` - replaced by a later ADR.
All records here are Accepted as of the migration spec being locked.

## Versions pinned during research (npm, 2026-07-19)

`effect` 3.22.0 (stable; v4 is beta). `@effect/sql` 0.52 / `@effect/sql-pg` 0.53 /
`@effect/sql-drizzle` 0.51. `@effect/opentelemetry` 0.64.0. `fastify` 5.10.
`drizzle-orm` 0.45.2, `drizzle-kit` 0.31.10. `bullmq` 5.80.9. `posthog-node` 5.45.
All `@effect/*` 0.x packages take breaking changes on minor bumps - pin exact versions.
