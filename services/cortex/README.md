# @meli/cortex

A Fastify microservice that generates structured spreadsheets from natural language prompts using a local LLM (Ollama / qwen2.5:7b) via the Vercel AI SDK.

## Architecture

- **Fastify** HTTP server with Zod type-safe routes
- **SheetService** - calls Ollama via `generateObject` to produce `{ columns, rows }` from a prompt + optional source URL
- **SheetGenerationJob** - BullMQ job that runs generation in the background and stores the result in Redis
- **WebFetcherService** - fetches any URL (HTML, XML, JSON) to provide context to the LLM
- **Drizzle ORM** - database access (PostgreSQL)
- **Redis** - job queue (BullMQ) and result caching

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sheets/generate` | Enqueue a sheet generation job |
| `GET` | `/sheets/jobs/:jobId` | Poll job status and result |
| `GET` | `/health` | Public healthcheck |
| `GET` | `/documentation` | OpenAPI reference (Scalar UI) |

### POST /sheets/generate

```json
{
  "prompt": "SEO audit checklist for an e-commerce site",
  "sourceUrl": "https://example.com/sitemap.xml"
}
```

Response `202`:
```json
{ "jobId": "01952abc-..." }
```

### GET /sheets/jobs/:jobId

Response:
```json
{
  "jobId": "01952abc-...",
  "status": "completed",
  "sheet": {
    "columns": [{ "id": "col-1", "label": "URL" }, { "id": "col-2", "label": "Issue" }],
    "rows": [{ "col-1": "https://...", "col-2": "Missing meta description" }]
  }
}
```

Status values: `pending` | `processing` | `completed` | `failed`

## Getting Started

### Prerequisites

- Node.js >= 24
- pnpm (managed via monorepo root)
- Docker

### 1. Copy environment config

```bash
pnpm run copy:config
```

This copies `.env.default` to `.env`. Review `AI_BASE_URL`, `AI_MODEL`, and `AI_API_KEY` if you want to use a different provider.

### 2. Start infrastructure

```bash
docker compose up -d
# or
pnpm run docker:start:dev
```

Starts:
- **PostgreSQL** on port `5433` — `postgresql://cortexuser:pass@127.0.0.1:5433/cortex`
- **Redis** on port `6380` — `redis://:sOmE_sEcUrE_pAsS@127.0.0.1:6380`
- **Ollama** on port `11434`

### 3. Pull the AI model (first time only)

```bash
docker exec -it $(docker compose ps -q ollama) ollama pull qwen2.5:7b
```

To list all downloaded models:
```bash
docker exec -it $(docker compose ps -q ollama) ollama list
```

### 4. Run database migrations

```bash
pnpm run db:apply-migrations
```

### 5. Generate a service-to-service JWT (first time only)

Cortex uses RS256 JWT authentication. The public key is committed in `.env.default`. You need the corresponding private key locally to mint tokens.

Generate a new keypair under `scripts/keys/` (gitignored):

```bash
mkdir -p scripts/keys
openssl genrsa -out scripts/keys/jwtRS256.key 4096
openssl rsa -in scripts/keys/jwtRS256.key -pubout -out scripts/keys/jwtRS256.key.pub
```

Then put the public key in `JWT_PUBLIC_KEY` in `.env` (and `.env.default`), and the private key in `CORTEX_JWT_PRIVATE_KEY` in `apps/web/.env.local`. Both are multi-line PEM values, so wrap them in double quotes:

```env
# services/cortex/.env  (contents of scripts/keys/jwtRS256.key.pub)
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"

# apps/web/.env.local  (contents of scripts/keys/jwtRS256.key)
CORTEX_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
```

The web app signs a fresh token (1 minute expiry) for every Cortex request, so there is no token to copy or refresh. Update both values whenever you rotate the keypair.

### 6. Start the service

```bash
pnpm run start:dev
```

Service runs on **http://localhost:3001**.

Logs are automatically written to `src/cortex.log` (gitignored) via pino's file transport. To tail:
```bash
tail -f src/cortex.log
```

For pretty-printed output:
```bash
tail -f src/cortex.log | npx pino-pretty
```

For hot-reload during development:
```bash
pnpm run start:dev:watch
```

## Local Observability (Prometheus + Grafana)

The docker-compose setup includes a local Prometheus + Grafana stack for observing metrics during development.

After starting infrastructure (`docker compose up -d`) and the service (`pnpm run start:dev`):

| URL | What |
|---|---|
| http://localhost:9090 | Prometheus — raw metric explorer and PromQL queries |
| http://localhost:3030 | Grafana — dashboards (login: `admin` / `pass`) |

A "Cortex" dashboard is auto-provisioned with four panels:

- **HTTP Request Rate** — requests per second by route and method
- **HTTP P95 Latency** — 95th percentile response time by route
- **Node.js Heap Used** — memory usage over time
- **HTTP Error Rate** — 4xx and 5xx responses by route

Prometheus scrapes the `/metrics` endpoint on port `9080` (a separate server started by `metricsPlugin`) every 15 seconds. Metrics are only available while `pnpm run start:dev` is running.

To add custom metrics (e.g. BullMQ job duration), use `prom-client` directly — the registry is available via `fastify.metrics.client`.

For distributed tracing and log aggregation, Tempo and Loki can be added to the docker-compose later — enabling `OTEL_ENABLED=true` and pointing `OTEL_EXPORTER_URL` at a local Tempo instance would give span-level visibility into every HTTP request, Postgres query, and Redis call.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `3001` | HTTP server port |
| `DATABASE_URL` | `postgresql://sheetuser:pass@localhost:5433/sheet_db` | PostgreSQL connection URL |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6380` | Redis port |
| `AI_BASE_URL` | `http://localhost:11434/v1` | Ollama (or any OpenAI-compatible) base URL |
| `AI_MODEL` | `qwen2.5:3b` | Model to use for generation. Use `qwen2.5:7b` or `qwen3` for higher quality (requires more RAM) |
| `AI_API_KEY` | `ollama` | API key (use `ollama` for local) |
| `JWT_PUBLIC_KEY` | *(see `.env.default`)* | RS256 public key for verifying incoming JWTs (multiline, `\n`-separated) |

Full list in [`.env.default`](./.env.default).

## Tests

Unit tests (no infrastructure required):
```bash
pnpm run test -- run src/infrastructure/config.spec.ts
```

Full test suite (requires Docker services running):
```bash
pnpm run test:migrate
pnpm run test
```

## Using a different AI provider

Point `AI_BASE_URL`, `AI_MODEL`, and `AI_API_KEY` at any OpenAI-compatible endpoint. For example, to use OpenAI directly:

```env
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-...
```

## Job Persistence

Sheet jobs use a **Redis + Postgres hybrid** to balance speed and durability.

### How it works

| Layer | Role |
|---|---|
| **Postgres** (`sheet.sheet_jobs`) | Source of truth. Written on every state transition: `pending` → `processing` → `completed` / `failed`. Survives Redis restarts. |
| **Redis** (`sheet-job:<jobId>`) | Cache for fast polling. TTL 1 hour. Populated on each state transition and re-seeded from Postgres on a cache miss. |

### State flow

```
POST /sheets/generate
  1. Write "pending" record to Postgres
  2. Enqueue BullMQ job
  3. Return jobId (202)

SheetGenerationJob.process
  4. Update Postgres → "processing", write to Redis cache
  5. Call Ollama
  6a. Success → Update Postgres → "completed" + result JSONB, write to Redis
  6b. Failure → Update Postgres → "failed" + error, write to Redis

GET /sheets/jobs/:jobId
  → Redis hit: return cached result (fast path)
  → Redis miss: query Postgres, re-populate Redis, return result
```

### Inspecting jobs in Postgres

```bash
# All jobs
docker exec meli-cortex-postgres-1 psql -U cortexuser -d cortex \
  -c "SELECT id, status, prompt, created_at FROM sheet.sheet_jobs ORDER BY created_at DESC;"

# A specific job (including result JSONB)
docker exec meli-cortex-postgres-1 psql -U cortexuser -d cortex \
  -c "SELECT id, status, result, error FROM sheet.sheet_jobs WHERE id='<jobId>';"
```

### Recovery after a Redis restart

No manual action needed. The next poll to `GET /sheets/jobs/:jobId` will fall back to Postgres and re-seed Redis automatically.

If a job was enqueued in BullMQ but not yet picked up when Redis crashed, the `sheet_jobs` row will remain in `pending` state in Postgres. You can identify and re-enqueue such jobs by querying:

```sql
-- Run via: docker exec meli-cortex-postgres-1 psql -U cortexuser -d cortex
SELECT id, prompt, source_url, created_at
FROM sheet.sheet_jobs
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '10 minutes';
```

## Database Migrations

Generate a new migration after changing a schema file:
```bash
pnpm run db:generate-migrations -- --name your_migration_name
pnpm run db:apply-migrations
```

## OpenAPI Documentation

While the service is running, visit **http://localhost:3001/documentation** for the interactive Scalar API reference.
