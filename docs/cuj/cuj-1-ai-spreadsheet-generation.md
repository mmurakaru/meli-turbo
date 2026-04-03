# CUJ 1 — AI Spreadsheet Generation

## User Story

> As a new or returning user, I visit `/create`, describe a spreadsheet I need in plain language, and receive a fully-populated editable spreadsheet within 30 seconds — without writing a single formula.

This is the **primary acquisition and activation journey**. It is the first experience most users have and the core value proposition of Meli. Failure here means zero retention.

---

## Journey Steps

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | User lands on `/create` | Page renders with prompt input, no auth required |
| 2 | User types a natural-language prompt | Character input is responsive (< 50 ms per keystroke) |
| 3 | User submits the prompt | Loading indicator appears, job is enqueued in Cortex |
| 4 | AI generates spreadsheet | Columns and rows are populated within the SLO window |
| 5 | User views the result | Spreadsheet is visible and scrollable, all cells readable |
| 6 | User saves the document | Auth gate presented if unauthenticated; document saved and user redirected to `/document/[id]` |

---

## Service Level Indicators (SLIs)

| SLI | Measurement method |
|-----|--------------------|
| **Page availability** | Synthetic probe to `GET /create` every 60 s; HTTP 200 = available |
| **Generation latency** | Time from form submit → spreadsheet rendered in DOM |
| **Generation success rate** | `jobs.status = 'completed'` / total jobs submitted |
| **Save success rate** | `createDocument` server action returning success / total calls |
| **Prompt input latency** | Lighthouse / RUM input delay on the textarea |

---

## Service Level Objectives (SLOs)

| SLO | Target | Measurement window | Error budget |
|-----|--------|--------------------|--------------|
| `/create` availability | **99.9 %** | 30-day rolling | 43.8 min/month |
| AI generation P50 latency | **< 8 s** | 7-day rolling | — |
| AI generation P95 latency | **< 30 s** | 7-day rolling | — |
| Generation success rate | **≥ 99 %** | 7-day rolling | 1 % failure budget |
| Save success rate | **≥ 99.5 %** | 30-day rolling | 0.5 % |
| Input delay (INP) | **< 200 ms** | Real-user monitoring | — |

> **Rationale**: 30 s P95 for generation accounts for cold-start latency in Cortex (Ollama model loading). Users tolerate up to ~45 s for AI tasks if a progress indicator is visible.

---

## Critical Failure Modes

1. **Cortex unreachable** — `/api/generate` returns 5xx; user sees no feedback. Mitigation: surface a user-friendly error with retry CTA.
2. **Job stuck in `pending`** — Polling times out after 60 × 1.5 s = 90 s; user is left on a spinner. Mitigation: explicit timeout message.
3. **Empty or malformed sheet returned** — AI returns `{ columns: [], rows: [] }`; blank spreadsheet shown. Mitigation: validate response shape before rendering.
4. **Save fails silently** — `createDocument` action error not surfaced. Mitigation: toast notification on error.

---

## Monitoring Targets

- Alert if generation P95 > 45 s for > 5 % of requests over any 10-minute window.
- Alert if `/create` availability drops below 99 % for any 5-minute window.
- Dashboard: job queue depth in BullMQ (Cortex), job failure rate, P50/P95/P99 generation latency.

---

## Playwright Test File

`apps/web/tests/e2e/cuj-1-ai-spreadsheet-generation.spec.ts`
