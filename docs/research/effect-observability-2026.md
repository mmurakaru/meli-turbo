# Effect (effect-ts) Observability Stack for a Fastify Backend — Mid-2026

Research target: the idiomatic Effect observability stack for `services/cortex`, a Fastify-based Node.js backend, replacing the current `@lokalise/fastify-extras` (Bugsnag + Amplitude + prom-client on a separate `:9080` metrics server), `@lokalise/opentelemetry-fastify-bootstrap` tracing, and pino file-transport logging.

All package versions were verified against the npm registry on 2026-07-19.

## Summary and recommendation

Standardize on a single OpenTelemetry pipeline driven from Effect, using `@effect/opentelemetry` as the one integration point for traces, metrics, and logs.
Configure one `NodeSdk.layer` that carries a shared `Resource` (`service.name = cortex`), a `BatchSpanProcessor` feeding an OTLP trace exporter, and a `metricReader` set to `@opentelemetry/exporter-prometheus`'s `PrometheusExporter`.
That last choice preserves the existing "metrics on a dedicated HTTP port" pattern exactly: the `PrometheusExporter` starts its own HTTP server exposing `/metrics`, so the local Prometheus/Grafana docker-compose keeps scraping a port with only the port number changing.
For logging, replace pino with an Effect structured JSON logger (`Logger.json`) to stdout and let the platform collect it; a pino sink is possible but adds a redundant formatting layer with no benefit once logs are structured and trace-correlated by Effect.
For error reporting, adopt the official `@sentry/effect` SDK (Sentry's Node SDK is actively maintained and has a first-party Effect integration; Bugsnag has no Effect integration) and capture failures off the Effect error channel with `Effect.tapErrorCause` plus `Cause.pretty`, while letting `@sentry/effect`'s tracer/logger layers wire spans and logs automatically.

Recommended stack (verified latest):

| Package | Version | Role |
|---|---|---|
| `effect` | 3.22.0 | Core: `Metric`, `Logger`, `Cause`, `Effect.withSpan` |
| `@effect/opentelemetry` | 0.64.0 | Traces + metrics + logs bridge (`NodeSdk`, `Resource`, `OtelMetrics`) |
| `@effect/platform` | 0.97.0 | Peer dep of `@effect/opentelemetry` |
| `@opentelemetry/exporter-prometheus` | 0.220.0 | `PrometheusExporter` (dedicated `/metrics` HTTP server) |
| `@opentelemetry/exporter-trace-otlp-http` (or `-grpc`) | 0.220.0 | OTLP trace export |
| `@opentelemetry/sdk-trace-node` / `-base` | 2.9.0 | Span processors |
| `@opentelemetry/sdk-metrics` | 2.9.0 | Metric reader plumbing |
| `@sentry/effect` | 10.66.0 | Error reporting off the Effect error channel |

Confidence: High for the tracing, metrics, and correlation recommendations (all confirmed against Effect docs, the `@effect/opentelemetry` source/DeepWiki, and verified npm peer deps). Medium-High for logging and error reporting (the shape of `@sentry/effect` layers is confirmed from Sentry's docs, but some exact API surface — e.g. capture-from-Cause helpers — should be validated against the installed version at implementation time).

## Tracing

Effect creates spans with `Effect.withSpan("name", { attributes })` and enriches the active span with `Effect.annotateCurrentSpan(key, value)`; the effect type is unchanged by wrapping.
The `@effect/opentelemetry` `NodeSdk.layer` provides the tracer to the whole application, so any `Effect.withSpan` in business code becomes a real OTel span with no per-call wiring.
Source: [Effect tracing docs](https://effect.website/docs/observability/tracing/).

```typescript
import { NodeSdk } from "@effect/opentelemetry"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"

export const TracingLive = NodeSdk.layer(() => ({
  resource: { serviceName: "cortex" },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_URL })
  )
}))
```

The exporter defaults to the standard OTLP endpoint (`http://localhost:4318` for HTTP) when no `url` is given ([Effect tracing docs](https://effect.website/docs/observability/tracing/)).
Cortex today already exports OTLP over gRPC via `@opentelemetry/exporter-trace-otlp-grpc` (`services/cortex/package.json`); either `-http` or `-grpc` works — swap the exporter class and keep the same `OTEL_EXPORTER_URL`/`OTEL_RESOURCE_ATTRIBUTES` env vars the current `config.ts` already defines (`services/cortex/src/infrastructure/config.ts:201-217`).
`Resource.layerFromEnv` reads `OTEL_SERVICE_NAME` / `OTEL_RESOURCE_ATTRIBUTES`, matching the existing `OTEL_RESOURCE_ATTRIBUTES=service.name=cortex` convention ([DeepWiki: Metrics and Resource Attributes](https://deepwiki.com/Effect-TS/effect/8.3-metrics-and-resource-attributes)).

Fastify request spans: keep `@fastify/otel` (already a dependency) as the auto-instrumentation for the HTTP layer, and let Effect spans nest underneath via the shared OTel context. This gives HTTP-level spans without hand-instrumenting every route.

Confidence: High.

## Metrics

Effect's `Metric` module (from `"effect"`) provides `counter`, `gauge`, `histogram`, `summary`, and `frequency`; metrics are tagged with `Metric.tagged` / `Metric.taggedWithLabels` and applied to effects (`yield* myCounter(Effect.succeed(1))`) ([Effect metrics docs](https://effect.website/docs/observability/metrics/)).

The export path that preserves the current separate-port pattern is `@opentelemetry/exporter-prometheus`'s `PrometheusExporter` used as the `metricReader` in `NodeSdk.layer`.
`@effect/opentelemetry` bridges Effect's process-wide metric registry to OTel via a `MetricProducer` (`OtelMetrics.layer` / `MetricProducerImpl`), which snapshots the Effect registry whenever a `MetricReader` polls and converts each metric to OTel `MetricData` — no manual per-metric registration ([DeepWiki: Metrics and Resource Attributes](https://deepwiki.com/Effect-TS/effect/8.3-metrics-and-resource-attributes)).

```typescript
import { NodeSdk } from "@effect/opentelemetry"
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus"

// PrometheusExporter starts its OWN HTTP server on the given port,
// serving /metrics — directly replacing the prom-client :9080 server.
export const MetricsLive = NodeSdk.layer(() => ({
  resource: { serviceName: "cortex" },
  metricReader: new PrometheusExporter({ port: 9080, endpoint: "/metrics" })
}))
```

Because `PrometheusExporter` runs a dedicated HTTP server ([npm: @opentelemetry/exporter-prometheus](https://www.npmjs.com/package/@opentelemetry/exporter-prometheus)), the `:9080` `/metrics` pattern from `@lokalise/fastify-extras` is preserved 1:1 — set `port: 9080` and the local Prometheus scrape config needs no change.
Metric type mapping (from the `@effect/opentelemetry` source): Counter → SUM, Gauge → GAUGE, Histogram → HISTOGRAM, Frequency → SUM (one data point per key), Summary → GAUGE quantiles ([DeepWiki: Metrics and Resource Attributes](https://deepwiki.com/Effect-TS/effect/8.3-metrics-and-resource-attributes)).

Migration note: the message-queue histograms currently defined via `@message-queue-toolkit/metrics` + prom-client (`services/cortex/src/infrastructure/metrics/MessageProcessingMetricsManager.ts`) can be re-expressed as `Metric.histogram` with the same bucket boundaries, so they surface through the same `/metrics` endpoint.

Alternative (if a collector is introduced): swap `metricReader` for a `PeriodicExportingMetricReader` with `@opentelemetry/exporter-metrics-otlp-http` (0.220.0) to push metrics to an OTel collector instead of exposing a scrape port. Only choose this if you also move traces/logs to a collector; otherwise the Prometheus exporter is simpler.

Confidence: High.

## Logging

Effect ships built-in loggers via the `Logger` module: `Logger.json` (structured JSON), `Logger.logfmt`, `Logger.structured`, `Logger.pretty`, and `Logger.stringLogger` (default), swapped in with `Logger.replace(Logger.defaultLogger, Logger.jsonLogger)` ([Effect logging docs](https://effect.website/docs/observability/logging/)).
`Effect.annotateLogs(key, value)` attaches structured context that propagates through nested effects, and `Effect.withLogSpan` records operation durations.

Recommendation: replace pino with `Logger.json` to stdout rather than routing Effect logs through a pino sink.
Reasoning: once Effect owns logging, its structured logger already emits JSON with level, timestamp, annotations, log spans, and fiber/trace context; sending that through pino only re-serializes the same data and reintroduces a transport to manage. Effect's logger also automatically includes the active span's trace/span IDs, giving log-to-trace correlation that a detached pino instance would not have. The current pino *file* transport (`services/cortex/src/cortex.log`) is better replaced by writing structured JSON to stdout and letting the platform/collector ship it.

```typescript
import { Logger } from "effect"

export const LoggingLive = Logger.replace(Logger.defaultLogger, Logger.json)
```

A custom sink remains possible via `Logger.make(({ logLevel, message, annotations, spans }) => { ... })` if a specific downstream format is required ([Effect logging docs](https://effect.website/docs/observability/logging/)), but it should be a last resort.
For log level, map the existing `LOG_LEVEL` env (`services/cortex/src/infrastructure/config.ts:63-68`) to `Logger.withMinimumLogLevel(LogLevel.*)`.

OTLP logs: `@effect/opentelemetry` peers on `@opentelemetry/sdk-logs` (`>=0.203.0 <0.300.0`), so it can also forward Effect logs to an OTel logs pipeline if you later want logs alongside traces/metrics in one backend. Start with `Logger.json` to stdout; add the OTLP logs exporter only when a logs backend exists to receive them.

Confidence: Medium-High (logger API and `Logger.json` confirmed; the exact OTLP-logs layer name should be checked against `@effect/opentelemetry` 0.64.0 at implementation).

## Correlation context (request ids)

Prefer Effect-native context over threading AsyncLocalStorage manually.
`Effect.annotateLogs` (for logs) and `Effect.annotateCurrentSpan` (for spans) attach a request id that propagates automatically down the fiber tree, which is the idiomatic replacement for the `@lokalise/fastify-extras` AsyncLocalStorage request-context provider ([Effect logging docs](https://effect.website/docs/observability/logging/), [Effect tracing docs](https://effect.website/docs/observability/tracing/)).
Effect propagates context through `FiberRef`s along the fiber graph rather than through Node's AsyncLocalStorage, so once a request id is set at the top of a request-handling effect, every nested effect (logs and spans) carries it without additional plumbing.

Interop pattern: at the Fastify boundary, read (or generate) the request id from the incoming request, then run the request's Effect with `Effect.annotateLogs("requestId", id)` and `Effect.annotateCurrentSpan("requestId", id)`. Because `@fastify/otel` already establishes the OTel context for the request, the trace/span IDs line up between the Fastify span and the Effect spans/logs nested inside.

```typescript
import { Effect } from "effect"

const handleRequest = (id: string, work: Effect.Effect<Response>) =>
  work.pipe(
    Effect.annotateLogs("requestId", id),
    Effect.tap(() => Effect.annotateCurrentSpan("requestId", id))
  )
```

Confidence: High for the annotation-propagation model; Medium on the exact Fastify-to-Effect boundary glue, which depends on how cortex bridges Fastify handlers into Effect.

## Error reporting (Sentry over Bugsnag)

Recommendation: replace Bugsnag with Sentry via the official `@sentry/effect` SDK (10.66.0), which has a first-party Effect integration; Bugsnag's JS SDK has no Effect integration, so keeping it would mean manual, lossy `FiberFailure` unwrapping.
`@sentry/effect` peer-depends on `effect ^3.0.0 || ^4.0.0-beta.50` ([npm registry: @sentry/effect](https://registry.npmjs.org/@sentry/effect/latest)), so it fits cortex's `effect` 3.22.0.

It exposes three composable pieces ([Sentry Effect docs](https://docs.sentry.io/platforms/javascript/guides/effect/)):
- `Sentry.SentryEffectTracer` — provide it as the tracer so `Effect.withSpan` spans reach Sentry tracing. For Effect v3: `Layer.setTracer(Sentry.SentryEffectTracer)`.
- `Sentry.SentryEffectLogger` — install with `Logger.replace(Logger.defaultLogger, Sentry.SentryEffectLogger)` to forward logs.
- `Sentry.SentryEffectMetricsLayer` — metrics forwarding.

Concrete capture pattern off the error channel: use `Effect.tapErrorCause` so you get the full `Cause` (nested causes, defects, and the span that failed), render it with `Cause.pretty`, and report it. This is more informative than logging a bare error message ([Effect Cause docs](https://effect-ts.github.io/effect/effect/Cause.ts.html), [Getting Proper Stack Traces from Effect.ts in Sentry](https://www.typekaizen.com/posts/sentry-effect/)).

```typescript
import { Cause, Effect } from "effect"
import * as Sentry from "@sentry/node"

export const reportErrors = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.tapErrorCause((cause) =>
      Effect.sync(() => {
        // Skip interruptions; report genuine failures and defects.
        if (Cause.isInterruptedOnly(cause)) return
        Sentry.captureException(Cause.squash(cause), {
          extra: { effectCause: Cause.pretty(cause) }
        })
      })
    )
  )
```

Caveat worth accounting for at implementation time: Effect wraps failures in `FiberFailure`, which can hide the original error from Sentry's grouping/stack-trace logic. The community-recommended mitigation is to surface the original error (e.g. via `runPromiseExit` + selective re-throw, or `Cause.squash`) so Sentry sees a real `Error` ([Getting Proper Stack Traces from Effect.ts in Sentry](https://www.typekaizen.com/posts/sentry-effect/); [getsentry/sentry-javascript#19641](https://github.com/getsentry/sentry-javascript/issues/19641)). Using `@sentry/effect`'s own tracer/logger layers avoids most of this because the integration understands Effect's structures.

Amplitude analytics is a product-analytics concern, not observability; it is orthogonal to this stack and can stay on its current SDK (`config.ts:233-268`) regardless of the observability migration.

Confidence: Medium-High (layer names and package confirmed from Sentry docs and verified npm metadata; exact v3-vs-v4 layer API and the best FiberFailure-unwrapping helper should be pinned against the installed `@sentry/effect` build).

## Local dev infrastructure (Prometheus + Grafana docker-compose)

Minimal change. Because the recommended metrics path uses `PrometheusExporter` on a dedicated port serving `/metrics`, the existing Prometheus scrape job keeps working — point it at the same host and the exporter port (set `PrometheusExporter({ port: 9080 })` to keep the current `:9080` unchanged, or update the scrape target to whatever port you choose) ([npm: @opentelemetry/exporter-prometheus](https://www.npmjs.com/package/@opentelemetry/exporter-prometheus)).
Grafana continues to read from Prometheus with no change.

Traces: if you want to view traces locally, add an OTLP-capable backend (e.g. Grafana Tempo, or an OpenTelemetry Collector fronting Tempo) and point `OTEL_EXPORTER_URL` at it; this is optional and independent of metrics. No collector is required for the metrics path.

Net effect on docker-compose: keep Prometheus + Grafana as-is (only the scrape port value may change); optionally add Tempo/Collector if local trace viewing is desired.

Confidence: High for the metrics-scrape continuity; Medium for the traces-backend suggestion (Tempo is a reasonable default but not the only option).

## Key sources

- Effect tracing: https://effect.website/docs/observability/tracing/
- Effect metrics: https://effect.website/docs/observability/metrics/
- Effect logging: https://effect.website/docs/observability/logging/
- `@effect/opentelemetry` metrics/resource internals: https://deepwiki.com/Effect-TS/effect/8.3-metrics-and-resource-attributes
- `@effect/opentelemetry` npm metadata/peer deps: https://registry.npmjs.org/@effect/opentelemetry/latest
- `@opentelemetry/exporter-prometheus`: https://www.npmjs.com/package/@opentelemetry/exporter-prometheus
- Sentry Effect SDK: https://docs.sentry.io/platforms/javascript/guides/effect/
- `@sentry/effect` npm metadata/peer deps: https://registry.npmjs.org/@sentry/effect/latest
- Effect Cause API: https://effect-ts.github.io/effect/effect/Cause.ts.html
- Sentry + Effect stack traces (FiberFailure caveat): https://www.typekaizen.com/posts/sentry-effect/
- Sentry Effect SDK tracking issue: https://github.com/getsentry/sentry-javascript/issues/19641
