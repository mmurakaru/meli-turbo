# CUJ 2 — Document Editing & Persistence

## User Story

> As an authenticated user, I open a saved document, edit cells directly in the spreadsheet, and see my changes persisted automatically — with no explicit "Save" button required.

This is the **retention and daily-active-use journey**. It determines whether Meli becomes a tool users return to daily or abandon after one use.

---

## Journey Steps

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | User signs in at `/sign-in` | Session created; redirected to `/dashboard` |
| 2 | User navigates to `/document/[id]` | Document loads with title, columns, and populated rows |
| 3 | User clicks a cell | Cell becomes an editable input |
| 4 | User types a new value | Value updates in the cell immediately (optimistic) |
| 5 | User pauses typing (> 800 ms) | Auto-save fires; "Saving…" indicator visible |
| 6 | Auto-save completes | "Saved" indicator shown; change durable in DB |
| 7 | User adds a row | Empty row appended; auto-saved |
| 8 | User renames a column | Header input becomes editable; persisted on blur |

---

## Service Level Indicators (SLIs)

| SLI | Measurement method |
|-----|--------------------|
| **Document load availability** | Synthetic probe to `GET /document/[id]` every 60 s |
| **Document load latency** | Time to interactive on `/document/[id]` |
| **Cell edit latency** | Time from keydown → cell value updated in DOM |
| **Auto-save success rate** | `updateDocument` action returning success / total calls |
| **Auto-save latency** | Time from debounce trigger → server action resolved |

---

## Service Level Objectives (SLOs)

| SLO | Target | Measurement window | Error budget |
|-----|--------|--------------------|--------------|
| Document page availability | **99.9 %** | 30-day rolling | 43.8 min/month |
| Document load P95 latency | **< 2 s** (LCP) | 7-day rolling | — |
| Cell edit responsiveness | **< 100 ms** (INP) | Real-user monitoring | — |
| Auto-save P95 latency | **< 1 s** | 7-day rolling | — |
| Auto-save success rate | **≥ 99.9 %** | 30-day rolling | 0.1 % |
| Structural ops success rate (add/delete row/column) | **≥ 99.5 %** | 30-day rolling | 0.5 % |

> **Rationale**: Users editing a spreadsheet expect immediate visual feedback (< 100 ms) and silent background persistence. A failed auto-save is catastrophic — it is worse than data loss because the user doesn't know it happened.

---

## Critical Failure Modes

1. **`updateDocument` returns error silently** — User keeps editing, all changes lost on navigation. Mitigation: toast error + retain dirty state indicator.
2. **Cell loses focus on save** — Debounce triggers re-render that blurs the active input. Mitigation: controlled input with stable key; no re-mount on save.
3. **Stale data on page load** — Next.js cache returns old document data. Mitigation: `revalidatePath` after every save; `no-store` on document fetch.
4. **Concurrent edit conflict** — Two tabs editing the same document; second save silently overwrites first. Mitigation: OT (issue #78) or last-write-wins with visible conflict warning.

---

## Monitoring Targets

- Alert if auto-save error rate > 0.5 % over any 5-minute window.
- Alert if document load P95 > 3 s for > 10 % of requests.
- Dashboard: auto-save call rate, error rate, P50/P95 latency; document page Largest Contentful Paint (LCP).

---

## Playwright Test File

`apps/web/tests/e2e/cuj-2-document-editing.spec.ts`
