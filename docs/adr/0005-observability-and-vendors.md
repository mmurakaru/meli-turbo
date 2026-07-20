# ADR 0005 - Observability pipeline and vendor scope

Status: Accepted
Tickets: [meli-turbo#155](https://github.com/mmurakaru/meli-turbo/issues/155), [meli-turbo#157](https://github.com/mmurakaru/meli-turbo/issues/157)

## Context

Cortex's observability comes from `@lokalise/fastify-extras` (Bugsnag error
reporting, Amplitude analytics, a `prom-client` metrics plugin on a separate :9080
server, a request-context provider) plus `@lokalise/opentelemetry-fastify-bootstrap`,
`pino` with a file transport, and a local Prometheus + Grafana docker-compose stack.
Decoupling means replacing all of it with an Effect-native, vendor-neutral stack and
deciding which vendor integrations "enterprise grade" actually requires.

## Decision

**One OpenTelemetry pipeline driven from Effect.** `@effect/opentelemetry`
`NodeSdk.layer` with a shared resource (`service.name`), OTLP trace export gated by
config, and a metric reader set to `@opentelemetry/exporter-prometheus`'s
`PrometheusExporter` on port 9080 - preserving the separate-port `/metrics` pattern
so the Prometheus/Grafana compose stack works unchanged. `Effect.Metric` definitions
bridge to Prometheus automatically.

**Logging:** Effect's built-in `Logger.json` to stdout in production,
`Logger.pretty` in development. No `pino`, no log files. Request/correlation context
via `Effect.annotateLogs` / `Effect.annotateCurrentSpan` over `FiberRef`, not
`AsyncLocalStorage`.

**Vendors: PostHog for both error tracking and product analytics.** One vendor
replaces both Bugsnag (errors) and Amplitude (analytics). A small custom Effect layer
wraps `posthog-node`: `Effect.tapErrorCause` -> `captureException`, plus event
capture. It is a no-op when `POSTHOG_API_KEY` is unset, so local development needs no
account. (PostHog was chosen over a Sentry-errors + Amplitude-analytics split to
minimize vendor surface; PostHog's native error tracking covers the need, with Sentry
as a documented fallback if deep span-level diagnostics become necessary.)

**Healthchecks:** a hand-rolled Effect layer (~50 lines: Postgres `SELECT 1` + Redis
ping, with mandatory-check semantics), replacing `@lokalise/healthcheck-utils`.

**Local observability stack** (Prometheus + Grafana docker-compose) ships in the
template as part of the baseline.

## Minimum bar for every derived service

JSON logs with trace correlation to stdout; a Prometheus `/metrics` endpoint; OTel
tracing available by config; database and redis healthchecks wired to the health
endpoint; a PostHog error-capture layer (no-op without an API key).

## Consequences

- `@lokalise/fastify-extras`, `@lokalise/opentelemetry-fastify-bootstrap`,
  `@lokalise/healthcheck-utils`, Bugsnag, and Amplitude are all removed.
- `pino` is removed; log tailing in dev is the pretty logger in the terminal rather
  than a `cortex.log` file.
- `@effect/opentelemetry` is 0.x - pin exact. The exact `posthog-node` capture API
  should be confirmed at implementation.
