# ADR 0001 - Adopt Effect.ts behind a Fastify 5 shell

Status: Accepted
Ticket: [meli-turbo#152](https://github.com/mmurakaru/meli-turbo/issues/152)

## Context

`services/cortex` is built on the Lokalise service template: `opinionated-machine`
DI, `@lokalise/fastify-extras`, `@lokalise/fastify-api-contracts`,
`@lokalise/background-jobs-common`, and the `@message-queue-toolkit/*` family. The
coupling ties the service's architecture to one organization's internal packages
and their release priorities. The goal is a vendor-neutral foundation that keeps
the enterprise structure (modular boundaries, DI discipline, typed errors,
observability) while removing that coupling. Effect.ts is the chosen foundation: a
mature, actively developed, vendor-neutral effect system.

The open question was how far the Effect boundary should extend on the HTTP layer:
adopt `@effect/platform` HttpApi as the server, or keep Fastify and run Effect
behind it.

## Decision

Adopt Effect.ts for all business logic, dependency wiring, and resource lifecycle.
Keep **Fastify 5 as the HTTP shell**. Effect runs behind a single
`ManagedRuntime` built from the application's Layers; route handlers are thin
adapters that build an `Effect` and execute it with `runtime.runPromise`, mapping
typed errors to HTTP responses.

Do **not** adopt `@effect/platform` HttpApi at this time.

Keep the existing Zod route contracts (via `fastify-type-provider-zod`), OpenAPI
generation (`@fastify/swagger`), and the Scalar reference UI. Keep `@fastify/jwt`
RS256 verification, `@fastify/helmet`, and CORS.

## Rationale

- As of mid-2026 HttpApi is not semver-stable: pre-1.0 (`@effect/platform` 0.x) on
  Effect v3, and explicitly under `effect/unstable/*` on the v4 line. Committing a
  production HTTP contract to it carries ongoing churn.
- HttpApi's headline benefit is an end-to-end typed client (`HttpApiClient`)
  generated from the contract. Cortex has no shared TypeScript contracts package
  and is consumed only over plain HTTP by a Next.js app, so that benefit is unused.
- Fastify already provides contract-first routing, OpenAPI, and Scalar on a stable
  major with a large production track record. Adopting HttpApi would mean migrating
  Zod contracts to Effect Schema and reimplementing auth/helmet/CORS for no
  consumable gain.
- `ManagedRuntime` is the officially documented way to run Effect inside a
  promise-based handler and permits incremental, route-by-route adoption.

## Consequences

- Contract validation happens at the Fastify/Zod edge; decoded plain values are
  handed into Effect. Internal Effect Schema typing at the boundary is forgone -
  low cost given no shared-contract consumer.
- Fastify plugins remain in play (helmet, cors, jwt, swagger, scalar), so those are
  not part of the decoupling. They are vendor-neutral and stable.
- The migration can proceed incrementally: business logic moves into Effect behind
  handlers without a big-bang HTTP rewrite.
- Error-to-HTTP mapping is not left to individual handlers: it is concentrated in a
  single seam ([ADR 0009](0009-error-handling-seam.md)) so error reporting and the
  response contract stay consistent, replacing `createErrorHandler` from
  `@lokalise/fastify-extras`.

## Revisit when

A shared TypeScript contracts package appears and a consumer would use a generated
typed client, **and** HttpApi reaches a 1.0+ semver guarantee (leaves
`effect/unstable/*`). At that point the typed-client benefit may outweigh the
stability cost.
