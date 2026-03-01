# Cortex — Manual Testing Guide

Step-by-step instructions for verifying the Cortex service locally.

## Prerequisites

1. Start infrastructure:
   ```bash
   cd services/cortex
   pnpm run docker:start:dev
   ```

2. Apply migrations (first time or after schema changes):
   ```bash
   pnpm run db:apply-migrations
   ```

3. Start the service:
   ```bash
   pnpm run start:dev
   ```

4. Generate a JWT token for authentication:
   ```bash
   pnpm run jwt:generate
   # Copy the printed token — you'll need it for all authenticated requests below.
   export TOKEN="<paste token here>"
   ```

---

## 1. Health check

```bash
curl http://localhost:3001/health
```

Expected:
```json
{"version":"1","gitCommitSha":"sha","heartbeat":"HEALTHY","checks":{"postgres":"HEALTHY","redis":"HEALTHY"}}
```

---

## 2. OpenAPI reference

Open **http://localhost:3001/documentation** in your browser. You should see the Scalar UI listing the `/sheets/generate` and `/sheets/jobs/:jobId` endpoints.

---

## 3. Generate a sheet (direct API)

```bash
curl -s -X POST http://localhost:3001/sheets/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"list of 3 programming languages with their main use case"}'
```

Expected (`202 Accepted`):
```json
{ "jobId": "019ca8e2-..." }
```

```bash
export JOB_ID="<jobId from above>"
```

---

## 4. Poll job status

```bash
curl -s http://localhost:3001/sheets/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

Repeat every few seconds. Status progression: `pending` → `processing` → `completed`.

Expected on completion:
```json
{
  "jobId": "...",
  "status": "completed",
  "sheet": {
    "columns": [{ "id": "col-1", "label": "Language" }, { "id": "col-2", "label": "Use Case" }],
    "rows": [{ "col-1": "Python", "col-2": "Data science" }]
  }
}
```

---

## 5. Generate with a source URL

```bash
curl -s -X POST http://localhost:3001/sheets/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"list all pages from this sitemap","sourceUrl":"https://meli.so/sitemap.xml"}'
```

---

## 6. Verify job durability (Postgres)

After generation, confirm the job and its result are persisted in Postgres independently of Redis:

```bash
# List recent jobs
docker exec meli-cortex-postgres-1 psql -U sheetuser -d sheet_db \
  -c "SELECT id, status, prompt, created_at FROM sheet.sheet_jobs ORDER BY created_at DESC LIMIT 5;"

# Inspect a specific job's result
docker exec meli-cortex-postgres-1 psql -U sheetuser -d sheet_db \
  -c "SELECT id, status, result, error FROM sheet.sheet_jobs WHERE id='$JOB_ID';"
```

### Simulate a Redis restart

```bash
docker restart meli-cortex-redis-1
sleep 3

# Poll — should fall back to Postgres and return the correct result
curl -s http://localhost:3001/sheets/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

The response should be identical to before the restart. Redis is re-seeded automatically on the first poll.

---

## 7. Web UI proxy (apps/web)

With `apps/web` running (`pnpm run dev` from root) and `CORTEX_API_KEY` set in `apps/web/.env.local`:

```bash
# Enqueue via Next.js proxy
curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"quarterly budget tracker"}'

# Poll via Next.js proxy
curl -s http://localhost:3000/api/jobs/<jobId>
```

---

## 8. Inspect service logs

```bash
tail -f services/cortex/src/cortex.log
```

Or live from the terminal where `pnpm run start:dev` is running.

---

## 9. Switch AI model

Edit `services/cortex/.env`:

```env
AI_MODEL=qwen2.5:7b   # higher quality, ~4.3 GB RAM
AI_MODEL=qwen2.5:3b   # default, ~2 GB RAM
```

Pull the model into Ollama if you haven't already:

```bash
docker exec -it $(docker compose ps -q ollama) ollama pull qwen2.5:7b
```

Restart Cortex to pick up the change.

---

## 10. Regenerate JWT keypair

Run this from `services/cortex/`:

```bash
mkdir -p scripts/keys
openssl genrsa -out scripts/keys/jwtRS256.key 4096
openssl rsa -in scripts/keys/jwtRS256.key -pubout -out scripts/keys/jwtRS256.key.pub
pnpm run jwt:generate
```

Copy the printed **public key** into `JWT_PUBLIC_KEY` in `.env` and `.env.default`.  
Copy the printed **token** into `CORTEX_API_KEY` in `apps/web/.env.local`.  
Restart both Cortex and `apps/web`.
