# CUJ 3 — Workspace Collaboration

## User Story

> As a workspace owner, I create a new workspace, invite a team member by email, and both of us can view and edit documents scoped to that workspace — with the owner controlling access.

This is the **team expansion and monetisation journey**. Workspace creation is the trigger for paid plan conversion, and team size drives the subscription value.

---

## Journey Steps

| Step | Action | Expected outcome |
|------|--------|-----------------|
| 1 | Authenticated user visits `/workspace/new` | Workspace creation form renders |
| 2 | User submits workspace name | Workspace created; user redirected to `/workspace/[id]` |
| 3 | Owner visits `/workspace/[id]/members` | Members list shows owner; invite input available |
| 4 | Owner submits an invitation email | Invitation record created; confirmation shown |
| 5 | Invited user signs up / signs in | Invitation detected; user added as workspace member |
| 6 | Member navigates to `/workspace/[id]` | Workspace documents visible to member |
| 7 | Member creates a document | Document scoped to workspace (`ownerType = 'workspace'`) |
| 8 | Owner sees member's document | Document appears in workspace document list |

---

## Service Level Indicators (SLIs)

| SLI | Measurement method |
|-----|--------------------|
| **Workspace page availability** | Synthetic probe to `GET /workspace/[id]` every 60 s |
| **Workspace creation success rate** | `createWorkspace` action success / total attempts |
| **Member invitation success rate** | Invitation record created / invites submitted |
| **Cross-user document visibility** | Owner creates doc → member session sees it within N seconds |
| **Workspace load latency** | Time to interactive on `/workspace/[id]` |

---

## Service Level Objectives (SLOs)

| SLO | Target | Measurement window | Error budget |
|-----|--------|--------------------|--------------|
| Workspace page availability | **99.9 %** | 30-day rolling | 43.8 min/month |
| Workspace creation success rate | **≥ 99.9 %** | 30-day rolling | 0.1 % |
| Invitation delivery success rate | **≥ 99 %** | 30-day rolling | 1 % |
| Cross-user doc visibility latency | **< 5 s** | 7-day rolling | — |
| Workspace page P95 load latency | **< 2 s** | 7-day rolling | — |
| Access control correctness | **100 %** — non-members must never see workspace docs | Continuous | Zero tolerance |

> **Rationale**: Access control correctness has zero error budget — leaking a workspace document to an unauthorised user is a security incident, not a reliability event.

---

## Critical Failure Modes

1. **Non-member can view workspace documents** — Authorization bug in `/workspace/[id]` query. Mitigation: row-level security check on every document query; integration test asserting 403 for non-members.
2. **Invitation silently fails** — Email delivery fails but invitation record isn't created. Mitigation: validate email format server-side; show success only after DB write confirms.
3. **Active workspace cookie stale** — User switches workspace but cookie still points to old workspace; wrong documents shown. Mitigation: `switchWorkspace` action clears and re-sets cookie atomically.
4. **Owner deletes workspace while members are active** — Members continue receiving 500s on workspace pages. Mitigation: cascade delete + middleware redirect for members of deleted workspaces.

---

## Monitoring Targets

- Alert if any request to `/workspace/[id]` returns 403 to a workspace member (false-positive auth block).
- Alert if `createWorkspace` failure rate > 0.5 % over any 10-minute window.
- Dashboard: active workspaces count, invitations sent/accepted/pending, workspace page error rate.
- Security: audit log all `workspace_members` mutations; alert on any document fetch where `userId` is not in `workspace_members`.

---

## Playwright Test File

`apps/web/tests/e2e/cuj-3-workspace-collaboration.spec.ts`
