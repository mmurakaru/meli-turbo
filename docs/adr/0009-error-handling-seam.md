# ADR 0009 - Central error-handling seam

Status: Accepted
Relates to: [ADR 0001](0001-adopt-effect-with-fastify-shell.md), [ADR 0005](0005-observability-and-vendors.md)

## Context

Cortex today delegates all error-to-HTTP mapping to `createErrorHandler` from
`@lokalise/fastify-extras` (`app.ts`), a single Fastify error handler that maps
domain errors to a status + body shape and reports every error to Bugsnag. ADR 0001
says route handlers "map typed errors to HTTP responses" but does not establish where
that mapping lives.

If each route registrar maps errors inline (as the initial skeleton did), two
problems follow once `@lokalise/fastify-extras` is removed:

1. Unexpected defects and Zod validation failures fall through to Fastify's default
   handler - a different response shape than cortex returns today, and **not captured
   by PostHog** (ADR 0005's error-reporting layer only sees the typed-error channel of
   effects that individual handlers explicitly run through `reportFailures`).
2. The error contract is smeared across every handler with no shared seam. The
   mapping is load-bearing behavior and should be concentrated in one place.

## Decision

Establish a single error-handling seam, owned by `runtime/`, that every route uses:

- A **typed-error-to-reply mapper**: one function mapping the application's tagged
  errors (e.g. `ExampleItemNotFound -> 404`, validation -> 400, `SqlError` / unknown
  defect -> 500) to a stable response shape. Handlers surface typed errors from their
  effect; the mapper - not each handler - decides status and body.
- A Fastify **`setErrorHandler`** that runs the mapper for anything thrown or returned
  as an error (including Zod validation errors from `fastify-type-provider-zod` and
  unexpected defects), and **captures to PostHog** (ADR 0005) for 5xx / unexpected
  cases. This is the single choke point that guarantees no error escapes reporting.
- A Fastify **`setNotFoundHandler`** returning the same error shape for unmatched
  routes.

Route adapters stay thin: they build an effect, `runPromise` it, and let typed
failures propagate to the seam. `reportFailures` remains available for capturing
inside background jobs (which have no Fastify error handler), but is no longer the
only path to PostHog for HTTP.

The `meli-service-template` skeleton demonstrates the seam (handler + `setErrorHandler`
+ `setNotFoundHandler`), and it becomes the reference the cortex migration follows.

## Consequences

- One place defines the HTTP error contract; the deletion test passes (removing the
  seam visibly breaks error mapping, so it is correctly concentrated).
- Every unexpected error is reported to PostHog regardless of which handler produced
  it, matching the coverage `createErrorHandler` + Bugsnag gave before.
- The response shape for errors is defined once and can be kept consistent with what
  consumers currently receive from cortex.
