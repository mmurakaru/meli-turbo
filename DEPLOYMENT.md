# Deployment Guide

> Reference for deploying Meli (web + cortex) to production.

BullMQ: https://docs.bullmq.io/guide/going-to-production

## Architecture

```
[Users] → [Vercel: Next.js web] → [Cortex: Fastify API + BullMQ worker]
                    ↓                          ↓
              [Neon Postgres]           [Neon Postgres]
                                        [Upstash Redis]
                                        [AI Provider]
```

## Services

| Service | Provider | Tier | Cost |
|---|---|---|---|
| Web | Vercel | Hobby | Free |
| Cortex | Fly.io | free (256MB) or paid | Free / ~$5/mo |
| Postgres | Neon | Free | Free |
| Redis | Upstash | Free (10k cmd/day) | Free |
| AI | OpenAI or self-hosted Ollama | — | See below |
| Stripe | Stripe | Optional | Free (no billing) |

---

## 1. Postgres (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Create two databases: `meli_web` and `meli_cortex`
3. Use the **pooled connection string** for the web app (avoids serverless connection exhaustion)
4. Run migrations:
   ```bash
   # Web
   pnpm --filter web db:migrate

   # Cortex
   cd services/cortex && npm run db:apply-migrations
   ```

---

## 2. Redis (Upstash)

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the host, port, and password
3. Note: free tier is 10,000 commands/day — sufficient for low-volume sheet generation
4. Both `REDIS_*` and `SCHEDULER_REDIS_*` env vars can point to the same Redis instance

---

## 3. AI Provider

### Option A: OpenAI (simplest)

```
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-...
```

Cost: ~$0.15/1M tokens. Negligible at 1k users.

### Option B: Self-hosted Ollama (free)

**Mac Mini / home server:**
- Mac Mini M2 16GB RAM can run `qwen2.5:7b` well
- Expose via [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (free, no port forwarding needed):
  ```bash
  cloudflared tunnel --url http://localhost:11434
  ```
- Set `AI_BASE_URL` to the tunnel URL

**Hetzner VM:**
- CX32 (4 vCPU, 8GB RAM, ~€4.5/mo) → `qwen2.5:3b`
- CX42 (8 vCPU, 16GB RAM, ~€12/mo) → `qwen2.5:7b` (better quality)
- Install Ollama, pull the model, expose port 11434

---

## 4. Cortex (Fly.io)

Cortex has a production-ready `Dockerfile`.

```bash
cd services/cortex
fly launch --no-deploy   # creates fly.toml
fly secrets set \
  DATABASE_URL="..." \
  REDIS_HOST="..." \
  REDIS_PORT="..." \
  REDIS_PASSWORD="..." \
  SCHEDULER_REDIS_HOST="..." \
  SCHEDULER_REDIS_PORT="..." \
  SCHEDULER_REDIS_PASSWORD="..." \
  JWT_PUBLIC_KEY="..." \
  AI_BASE_URL="..." \
  AI_MODEL="..." \
  AI_API_KEY="..." \
  APP_ENV=production \
  NODE_ENV=production \
  APP_BIND_ADDRESS=0.0.0.0 \
  LOG_LEVEL=info \
  OTEL_ENABLED=false \
  BUGSNAG_ENABLED=false \
  AMPLITUDE_ENABLED=false \
  METRICS_ENABLED=false
fly deploy
```

> **Note on JWT:** Cortex validates Bearer JWTs on all non-skipped routes. Web currently
> sends `CORTEX_API_KEY` as a raw Bearer token. Before going live, either:
> - Add `/sheets/generate` and `/sheets/jobs/:id` to the skip list in `jwtTokenPlugin`, or
> - Have web mint a proper JWT signed with the corresponding private key

---

## 5. Meli Web (Vercel)

```bash
cd apps/web
vercel --prod
```

**Required environment variables in Vercel dashboard:**

| Variable | Value |
|---|---|
| `POSTGRES_URL` | Neon **pooled** connection string for web DB |
| `SESSION_SECRET` | Random 32+ char string (`openssl rand -base64 32`) |
| `BASE_URL` | `https://yourdomain.com` |
| `CORTEX_URL` | Your Fly.io Cortex URL |
| `CORTEX_API_KEY` | Shared secret (must match JWT setup in Cortex) |
| `NODE_ENV` | `production` |
| `STRIPE_SECRET_KEY` | Optional — skip if not using billing |
| `STRIPE_WEBHOOK_SECRET` | Optional |
| `GOOGLE_CLIENT_ID` | Optional — skip if not using Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional |

---

## Scalability Notes

- **1,000 users / ~50–100 concurrent:** current single-instance setup handles this comfortably
- **AI job concurrency:** 5 parallel jobs per Cortex instance (configured in `SheetGenerationJob`). Scale by adding Cortex instances — they all share the same BullMQ Redis queue
- **Postgres connections:** Always use Neon's pooled URL for web (serverless safe)
- **Redis command budget:** If Upstash free tier (10k/day) is exhausted, upgrade to pay-as-you-go (~$0.20/100k)

---

## Checklist Before Go-Live

- [ ] Postgres migrations run for both web and cortex
- [ ] Neon pooled URL used for `POSTGRES_URL` in web
- [ ] JWT auth between web → cortex resolved (skip list or proper JWT minting)
- [ ] `SESSION_SECRET` is a strong random value (not reused from dev)
- [ ] `OTEL_ENABLED`, `BUGSNAG_ENABLED`, `AMPLITUDE_ENABLED` configured as needed
- [ ] Stripe webhooks configured if billing is active
- [ ] AI provider tested end-to-end (sheet generation works)
- [ ] Custom domain configured in Vercel
