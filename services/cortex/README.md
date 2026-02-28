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
- **PostgreSQL** on port `5433`
- **Redis** on port `6380`
- **Ollama** on port `11434`

### 3. Pull the AI model (first time only)

```bash
docker exec -it $(docker compose ps -q ollama) ollama pull qwen2.5:7b
```

### 4. Run database migrations

```bash
pnpm run db:apply-migrations
```

### 5. Start the service

```bash
pnpm run start:dev
```

Service runs on **http://localhost:3001**.

For hot-reload during development:
```bash
pnpm run start:dev:watch
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `3001` | HTTP server port |
| `DATABASE_URL` | `postgresql://sheetuser:pass@localhost:5433/sheet_db` | PostgreSQL connection URL |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6380` | Redis port |
| `AI_BASE_URL` | `http://localhost:11434/v1` | Ollama (or any OpenAI-compatible) base URL |
| `AI_MODEL` | `qwen2.5:7b` | Model to use for generation |
| `AI_API_KEY` | `ollama` | API key (use `ollama` for local) |

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

## Database Migrations

Generate a new migration after changing a schema file:
```bash
pnpm run db:generate-migrations -- --name your_migration_name
pnpm run db:apply-migrations
```

## OpenAPI Documentation

While the service is running, visit **http://localhost:3001/documentation** for the interactive Scalar API reference.
