# Environment variables

Generated from `src/runtime/config.ts` by `node --run docs:generate` - do not edit by hand.

## app

| Variable | Default | Secret | Description |
|---|---|---|---|
| `NODE_ENV` | development |  | Runtime environment; selects pretty vs JSON logging. |
| `APP_ENV` | development |  | Deployment environment reported to observability vendors. |
| `APP_VERSION` | VERSION_NOT_SET |  | Application version reported by the health endpoint and traces. |
| `GIT_COMMIT_SHA` | COMMIT_SHA_NOT_SET |  | Git commit SHA of the deployed build, reported by the health endpoint. |
| `APP_PORT` | 3000 |  | HTTP server listening port. |
| `APP_BIND_ADDRESS` | 0.0.0.0 |  | HTTP server bind address (0.0.0.0 exposes on all interfaces). |
| `BASE_URL` |  |  | Public URL where the service is reachable, used in the OpenAPI spec. |
| `LOG_LEVEL` | Info |  | Minimum log level emitted by the Effect logger. |
| `JWT_PUBLIC_KEY` | **required** |  | RS256 public key (PEM) used to verify request JWTs; use || as a newline separator on a single line. |

## database

| Variable | Default | Secret | Description |
|---|---|---|---|
| `DATABASE_URL` | **required** | yes | PostgreSQL connection URL including credentials and database name. |
| `DATABASE_MAX_CONNECTIONS` | 10 |  | Maximum size of the PostgreSQL connection pool. |

## redis

| Variable | Default | Secret | Description |
|---|---|---|---|
| `REDIS_HOST` | localhost |  | Redis hostname used for the result cache and the BullMQ connection. |
| `REDIS_PORT` | 6379 |  | Redis port. |
| `REDIS_USERNAME` | *(unset)* |  | Redis authentication username; omit for an unauthenticated Redis. |
| `REDIS_PASSWORD` | *(unset)* | yes | Redis authentication password; omit for an unauthenticated Redis. |
| `REDIS_KEY_PREFIX` | cortex |  | Prefix applied to every Redis key. |
| `REDIS_USE_TLS` | true |  | Whether to use TLS for the Redis connection. |

## queue

| Variable | Default | Secret | Description |
|---|---|---|---|
| `QUEUE_CONCURRENCY` | 5 |  | Number of jobs a BullMQ worker processes concurrently. |

## ai

| Variable | Default | Secret | Description |
|---|---|---|---|
| `AI_BASE_URL` | http://localhost:11434/v1 |  | Base URL for the OpenAI-compatible AI provider. |
| `AI_MODEL` | qwen2.5:7b |  | Model identifier used for sheet generation. |
| `AI_API_KEY` | ollama | yes | API key for the AI provider (use "ollama" for a local Ollama). |

## posthog

| Variable | Default | Secret | Description |
|---|---|---|---|
| `POSTHOG_API_KEY` | *(unset)* | yes | PostHog project API key; when unset, error and event capture are no-ops. |
| `POSTHOG_HOST` | https://eu.i.posthog.com |  | PostHog ingestion host. |

## observability

| Variable | Default | Secret | Description |
|---|---|---|---|
| `OTEL_SERVICE_NAME` | cortex |  | Resource service.name attached to traces and metrics. |
| `OTEL_TRACING_ENABLED` | false |  | Whether to export OpenTelemetry traces via OTLP. |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | http://localhost:4318/v1/traces |  | OTLP HTTP traces endpoint used when tracing is enabled. |
| `METRICS_PROMETHEUS_PORT` | 9080 |  | Port on which the Prometheus exporter serves /metrics. |
